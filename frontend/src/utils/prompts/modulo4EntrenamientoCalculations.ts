import { apiFetch } from '../../api/client';
import { type EstadisticaSerieRow } from '../../features/entrenamiento/estadisticas/useEstadisticas';
import { type GrupoMuscular } from '../../features/entrenamiento/GrupoMuscularForm';
import { formatearModulo4Entrenamiento } from '../../features/usuario/prompts/promptModularTemplate';

interface ResumenGrupoStats {
  nombre: string;
  series: number;
  ejercicios: Set<string>;
  ultimaFechaMs: number | null;
}

const formatearTiempoRelativo = (ahoraMs: number, fechaMs: number): string => {
  const diffMs = Math.max(0, ahoraMs - fechaMs);
  const diffHoras = Math.max(1, Math.round(diffMs / (1000 * 3600)));

  if (diffHoras < 48) {
    return diffHoras === 1 ? 'hace 1 hora' : `hace ${diffHoras} horas`;
  }

  const diffDias = Math.round(diffHoras / 24);
  return diffDias === 1 ? 'hace 1 día' : `hace ${diffDias} días`;
};

/**
 * Compila y formatea el Modulo 4: Entrenamiento y Carga Biomecanica.
 */
export const compilarModulo4Entrenamiento = async (): Promise<string> => {
  try {
    const [resHistorial, resGrupos] = await Promise.allSettled([
      apiFetch('/api/estadisticas/historial').then(
        (r) => (r.ok ? (r.json() as Promise<EstadisticaSerieRow[]>) : Promise.resolve([]))
      ),
      apiFetch('/api/grupos-musculares').then(
        (r) => (r.ok ? (r.json() as Promise<GrupoMuscular[]>) : Promise.resolve([]))
      ),
    ]);

    const historial: EstadisticaSerieRow[] =
      resHistorial.status === 'fulfilled' && Array.isArray(resHistorial.value)
        ? resHistorial.value
        : [];

    const catalogoGrupos: GrupoMuscular[] =
      resGrupos.status === 'fulfilled' && Array.isArray(resGrupos.value)
        ? resGrupos.value
        : [];

    const ahora = new Date();
    const ahoraMs = ahora.getTime();
    const hace7dMs = ahoraMs - 7 * 24 * 3600 * 1000;
    const hace28dMs = ahoraMs - 28 * 24 * 3600 * 1000;

    const series28d = historial.filter(
      (s) => new Date(s.fecha_inicio).getTime() >= hace28dMs
    );
    const series7d = historial.filter(
      (s) => new Date(s.fecha_inicio).getTime() >= hace7dMs
    );

    // 1. ENTRENO_FRECUENCIA_SEM: Sesiones unicas en los ultimos 28 dias / 4
    const sesionesUnicas28d = new Set(series28d.map((s) => s.historial_rutina_id)).size;
    const entrenoFrecuenciaSem = (sesionesUnicas28d / 4).toFixed(1);

    // 2. ACWR_VALOR: Series_7d / (Series_28d / 4)
    const totalSeries7d = series7d.length;
    const totalSeries28d = series28d.length;
    const cargaCronicaSemanal = totalSeries28d / 4;

    let acwrValor = '0.00';
    if (cargaCronicaSemanal > 0) {
      acwrValor = (totalSeries7d / cargaCronicaSemanal).toFixed(2);
    }

    // 3. RESUMEN_SERIES_GRUPO_7D (con todos los grupos del catalogo + ultimo estimulo)
    const mapaGrupos = new Map<string, ResumenGrupoStats>();

    // Inicializar todos los grupos musculares del catalogo con 0 series
    for (const g of catalogoGrupos) {
      const nombreLimpio = g.nombre.trim();
      if (nombreLimpio && !mapaGrupos.has(nombreLimpio)) {
        mapaGrupos.set(nombreLimpio, {
          nombre: nombreLimpio,
          series: 0,
          ejercicios: new Set<string>(),
          ultimaFechaMs: null,
        });
      }
    }

    // Acumular las series de los ultimos 7 dias
    for (const s of series7d) {
      const fechaSerieMs = new Date(s.fecha_inicio).getTime();
      const gruposDeSerie =
        Array.isArray(s.grupos_musculares) && s.grupos_musculares.length > 0
          ? s.grupos_musculares
          : ['Sin clasificar'];

      for (const nombreRaw of gruposDeSerie) {
        const nombreGrupo = nombreRaw.trim();
        if (!nombreGrupo) continue;

        let entry = mapaGrupos.get(nombreGrupo);
        if (!entry) {
          entry = {
            nombre: nombreGrupo,
            series: 0,
            ejercicios: new Set<string>(),
            ultimaFechaMs: null,
          };
          mapaGrupos.set(nombreGrupo, entry);
        }

        entry.series += 1;
        if (s.ejercicio_nombre && s.ejercicio_nombre.trim()) {
          entry.ejercicios.add(s.ejercicio_nombre.trim().toLowerCase());
        }
        if (entry.ultimaFechaMs === null || fechaSerieMs > entry.ultimaFechaMs) {
          entry.ultimaFechaMs = fechaSerieMs;
        }
      }
    }

    const listaGrupos = Array.from(mapaGrupos.values()).sort((a, b) => {
      if (b.series !== a.series) return b.series - a.series;
      return a.nombre.localeCompare(b.nombre, 'es');
    });

    let resumenSeriesGrupo7d = '  * Sin grupos musculares ni series registradas en los últimos 7 días';

    if (listaGrupos.length > 0) {
      const vinetas = listaGrupos.map((g) => {
        if (g.series > 0 && g.ultimaFechaMs !== null) {
          const listaEjercicios = Array.from(g.ejercicios).join(', ');
          const tiempoRelativo = formatearTiempoRelativo(ahoraMs, g.ultimaFechaMs);
          return `  * ${g.nombre}: ${g.series} series (${listaEjercicios}) — Último estímulo: ${tiempoRelativo}`;
        }
        return `  * ${g.nombre}: 0 series (sin estímulo en los últimos 7 días)`;
      });
      resumenSeriesGrupo7d = vinetas.join('\n');
    }

    return formatearModulo4Entrenamiento({
      entrenoFrecuenciaSem,
      resumenSeriesGrupo7d,
      acwrValor,
    });
  } catch (error) {
    console.error('Error al compilar el Modulo 4 de entrenamiento:', error);
    return formatearModulo4Entrenamiento({
      entrenoFrecuenciaSem: '--',
      resumenSeriesGrupo7d: '  * Sin datos disponibles',
      acwrValor: '--',
    });
  }
};

