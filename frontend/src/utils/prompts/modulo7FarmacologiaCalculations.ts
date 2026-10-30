import { apiFetch } from '../../api/client';
import { type Medicamento } from '../../features/medicamentos/MedicamentoForm';
import { type MedicacionActiva } from '../../features/medicamentos/MedicacionActivaForm';
import { type HistorialMedicacion } from '../../features/medicamentos/HistorialMedicacionForm';
import {
  type FiltrosModulo7Farmacologia,
  formatearModulo7Farmacologia,
} from '../../features/usuario/prompts/promptModularTemplate';

export interface OpcionItemModulo7 {
  id: string;
  medicamentoId: string;
  nombre: string;
  detalle: string;
}

export interface OpcionesFiltroModulo7 {
  farmacosActivos: OpcionItemModulo7[];
  suplementosActivos: OpcionItemModulo7[];
  tomasPuntuales: OpcionItemModulo7[];
}

/**
 * Determina si una categoria corresponde a suplementacion nutricional.
 */
export const esCategoriaSuplemento = (categoriaNombre?: string | null): boolean => {
  if (!categoriaNombre) return false;
  const norm = categoriaNombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const palabrasClave = [
    'suplement',
    'vitamin',
    'nutric',
    'mineral',
    'prote',
    'amino',
    'creatina',
    'omega',
    'ergogen',
    'fitoterap',
    'probiot',
  ];

  return palabrasClave.some((kw) => norm.includes(kw));
};

const formatearTiempoRelativo = (ahoraMs: number, fechaMs: number): string => {
  const diffMs = Math.max(0, ahoraMs - fechaMs);
  const diffHoras = Math.max(1, Math.round(diffMs / (1000 * 3600)));

  if (diffHoras < 48) {
    return diffHoras === 1 ? 'hace 1 hora' : `hace ${diffHoras} horas`;
  }

  const diffDias = Math.round(diffHoras / 24);
  return diffDias === 1 ? 'hace 1 día' : `hace ${diffDias} días`;
};

const formatearTiempoUso = (
  fechaInicio?: string | null,
  frecuencia?: string
): string => {
  if (!fechaInicio) {
    return frecuencia === 'Segun necesidad' ? 'Esporádico / A demanda' : 'No especificado';
  }
  const inicioMs = new Date(fechaInicio).getTime();
  if (isNaN(inicioMs)) return 'No especificado';

  const diffDias = Math.max(1, Math.round((Date.now() - inicioMs) / (1000 * 3600 * 24)));
  if (diffDias < 30) {
    return diffDias === 1 ? '1 día' : `${diffDias} días`;
  }
  if (diffDias < 365) {
    const meses = Math.round(diffDias / 30);
    return meses === 1 ? '1 mes' : `${meses} meses`;
  }
  const anos = (diffDias / 365).toFixed(1).replace(/\.0$/, '');
  return anos === '1' ? '1 año' : `${anos} años`;
};

const formatearDosisTotal = (
  cantidad: number,
  dosisBase: number | undefined,
  unidad: string
): string => {
  if (dosisBase && dosisBase > 0) {
    const total = Number((cantidad * dosisBase).toFixed(2));
    return `${total} ${unidad}`;
  }
  return `${cantidad} ${unidad}`;
};

/**
 * Obtiene las listas clasificadas para poblar los filtros interactivos del Modulo 7 en PromptFiltrosForm.
 */
export const obtenerOpcionesFiltroModulo7 = async (): Promise<OpcionesFiltroModulo7> => {
  const [resActivas, resMedicamentos, resHistorial] = await Promise.allSettled([
    apiFetch('/api/medicaciones-activas').then((r) =>
      r.ok ? (r.json() as Promise<MedicacionActiva[]>) : Promise.resolve([])
    ),
    apiFetch('/api/medicamentos').then((r) =>
      r.ok ? (r.json() as Promise<Medicamento[]>) : Promise.resolve([])
    ),
    apiFetch('/api/historial-medicacion').then((r) =>
      r.ok ? (r.json() as Promise<HistorialMedicacion[]>) : Promise.resolve([])
    ),
  ]);

  const activas: MedicacionActiva[] =
    resActivas.status === 'fulfilled' && Array.isArray(resActivas.value)
      ? resActivas.value
      : [];
  const medicamentos: Medicamento[] =
    resMedicamentos.status === 'fulfilled' && Array.isArray(resMedicamentos.value)
      ? resMedicamentos.value
      : [];
  const historial: HistorialMedicacion[] =
    resHistorial.status === 'fulfilled' && Array.isArray(resHistorial.value)
      ? resHistorial.value
      : [];

  const catalogoMap = new Map<string, Medicamento>();
  for (const m of medicamentos) {
    catalogoMap.set(m.id, m);
  }

  const farmacosActivos: OpcionItemModulo7[] = [];
  const suplementosActivos: OpcionItemModulo7[] = [];
  const idsMedicamentosActivos = new Set<string>();

  for (const ma of activas.filter((a) => a.activo)) {
    idsMedicamentosActivos.add(ma.medicamento_id);
    const medInfo = catalogoMap.get(ma.medicamento_id);
    const dosisStr = formatearDosisTotal(ma.cantidad, medInfo?.dosis, ma.unidad_dosis);
    const pautaStr =
      ma.frecuencia === 'Segun necesidad' ? 'Según necesidad' : ma.frecuencia;

    const item: OpcionItemModulo7 = {
      id: ma.id,
      medicamentoId: ma.medicamento_id,
      nombre: ma.medicamento_nombre,
      detalle: `${dosisStr} · ${pautaStr}`,
    };

    if (esCategoriaSuplemento(medInfo?.categoria_nombre)) {
      suplementosActivos.push(item);
    } else {
      farmacosActivos.push(item);
    }
  }

  // Tomas puntuales en los ultimos 14 dias que no pertenecen a una medicacion activa
  const ahoraMs = Date.now();
  const hace14dMs = ahoraMs - 14 * 24 * 3600 * 1000;
  const tomas14d = historial.filter(
    (h) =>
      !h.pendiente &&
      new Date(h.fecha_hora).getTime() >= hace14dMs &&
      !idsMedicamentosActivos.has(h.medicamento_id)
  );

  const mapaPuntuales = new Map<
    string,
    { nombre: string; conteo: number; dosisStr: string }
  >();

  for (const t of tomas14d) {
    const existente = mapaPuntuales.get(t.medicamento_id);
    const dosisStr = formatearDosisTotal(
      t.cantidad_tomada,
      t.dosis_base,
      t.unidad_dosis
    );
    if (!existente) {
      mapaPuntuales.set(t.medicamento_id, {
        nombre: t.medicamento_nombre,
        conteo: 1,
        dosisStr,
      });
    } else {
      existente.conteo += 1;
    }
  }

  const tomasPuntuales: OpcionItemModulo7[] = Array.from(
    mapaPuntuales.entries()
  ).map(([medId, info]) => ({
    id: medId,
    medicamentoId: medId,
    nombre: info.nombre,
    detalle: `${info.dosisStr} · ${info.conteo} ${info.conteo === 1 ? 'toma' : 'tomas'} en 14d`,
  }));

  return {
    farmacosActivos,
    suplementosActivos,
    tomasPuntuales,
  };
};

/**
 * Compila y formatea el Modulo 7: Farmacologia y Suplementacion Activa.
 */
export const compilarModulo7Farmacologia = async (
  filtros?: FiltrosModulo7Farmacologia
): Promise<string> => {
  try {
    const [resActivas, resMedicamentos, resHistorial] = await Promise.allSettled([
      apiFetch('/api/medicaciones-activas').then((r) =>
        r.ok ? (r.json() as Promise<MedicacionActiva[]>) : Promise.resolve([])
      ),
      apiFetch('/api/medicamentos').then((r) =>
        r.ok ? (r.json() as Promise<Medicamento[]>) : Promise.resolve([])
      ),
      apiFetch('/api/historial-medicacion').then((r) =>
        r.ok ? (r.json() as Promise<HistorialMedicacion[]>) : Promise.resolve([])
      ),
    ]);

    const todasPlanificaciones: MedicacionActiva[] =
      resActivas.status === 'fulfilled' && Array.isArray(resActivas.value)
        ? resActivas.value
        : [];
    const medicamentos: Medicamento[] =
      resMedicamentos.status === 'fulfilled' && Array.isArray(resMedicamentos.value)
        ? resMedicamentos.value
        : [];
    const historial: HistorialMedicacion[] =
      resHistorial.status === 'fulfilled' && Array.isArray(resHistorial.value)
        ? resHistorial.value
        : [];

    const catalogoMap = new Map<string, Medicamento>();
    for (const m of medicamentos) {
      catalogoMap.set(m.id, m);
    }

    const ahoraMs = Date.now();
    const hace14dMs = ahoraMs - 14 * 24 * 3600 * 1000;
    const hace30dMs = ahoraMs - 30 * 24 * 3600 * 1000;

    // Tomas reales de los ultimos 14 dias
    const tomas14d = historial.filter(
      (h) => !h.pendiente && new Date(h.fecha_hora).getTime() >= hace14dMs
    );

    const activas = todasPlanificaciones.filter((a) => a.activo);
    const idsMedicamentosActivos = new Set<string>(
      activas.map((a) => a.medicamento_id)
    );

    const vinetasFarmacos: string[] = [];
    const vinetasSuplementos: string[] = [];

    for (const ma of activas) {
      const medInfo = catalogoMap.get(ma.medicamento_id);
      const esSupl = esCategoriaSuplemento(medInfo?.categoria_nombre);

      if (esSupl) {
        if (filtros) {
          if (!filtros.incluirSuplementosActivos) continue;
          if (!filtros.suplementosActivosIds.includes(ma.id)) continue;
        }

        const dosisStr = formatearDosisTotal(
          ma.cantidad,
          medInfo?.dosis,
          ma.unidad_dosis
        );
        const pautaStr =
          ma.frecuencia === 'Segun necesidad' ? 'Según necesidad' : ma.frecuencia;
        const anotacion =
          ma.anotaciones?.trim() || medInfo?.notas?.trim() || 'Sin anotaciones';

        vinetasSuplementos.push(
          `  * ${ma.medicamento_nombre} | Dosis: ${dosisStr} (${pautaStr}) | Anotación toma: ${anotacion}`
        );
      } else {
        if (filtros) {
          if (!filtros.incluirFarmacosActivos) continue;
          if (!filtros.farmacosActivosIds.includes(ma.id)) continue;
        }

        const dosisStr = formatearDosisTotal(
          ma.cantidad,
          medInfo?.dosis,
          ma.unidad_dosis
        );
        const pautaBase =
          ma.frecuencia === 'Segun necesidad'
            ? 'A demanda / Según necesidad'
            : ma.frecuencia;
        const pautaConNotas = ma.anotaciones?.trim()
          ? `${pautaBase} (${ma.anotaciones.trim()})`
          : pautaBase;
        const tiempoUso = formatearTiempoUso(ma.fecha_inicio, ma.frecuencia);

        let extraTomasRecientes = '';
        if (ma.frecuencia === 'Segun necesidad') {
          const tomasDeEsteMed = tomas14d.filter(
            (t) => t.medicamento_id === ma.medicamento_id
          );
          if (tomasDeEsteMed.length > 0) {
            const ultimaMs = Math.max(
              ...tomasDeEsteMed.map((t) => new Date(t.fecha_hora).getTime())
            );
            const haceStr = formatearTiempoRelativo(ahoraMs, ultimaMs);
            extraTomasRecientes = ` | Tomas recientes (14d): ${tomasDeEsteMed.length} ${
              tomasDeEsteMed.length === 1 ? 'toma' : 'tomas'
            } (última ${haceStr})`;
          } else {
            extraTomasRecientes = ' | Tomas recientes (14d): Ninguna';
          }
        }

        vinetasFarmacos.push(
          `  * ${ma.medicamento_nombre} | Dosis: ${dosisStr} | Pauta: ${pautaConNotas} | Tiempo de uso: ${tiempoUso}${extraTomasRecientes}`
        );
      }
    }

    // 3. Tomas puntuales de los ultimos 14 dias (que no estan en medicacion activa)
    const vinetasPuntuales: string[] = [];
    const incluirPuntuales = filtros ? filtros.incluirTomasPuntuales : true;

    if (incluirPuntuales) {
      const tomasPuntualesRaw = tomas14d.filter(
        (t) => !idsMedicamentosActivos.has(t.medicamento_id)
      );

      const agrupadasPuntuales = new Map<
        string,
        {
          nombre: string;
          dosisStr: string;
          conteo: number;
          ultimaFechaMs: number;
        }
      >();

      for (const t of tomasPuntualesRaw) {
        if (
          filtros &&
          !filtros.tomasPuntualesMedicamentoIds.includes(t.medicamento_id)
        ) {
          continue;
        }

        const fechaMs = new Date(t.fecha_hora).getTime();
        const dosisStr = formatearDosisTotal(
          t.cantidad_tomada,
          t.dosis_base,
          t.unidad_dosis
        );
        const actual = agrupadasPuntuales.get(t.medicamento_id);
        if (!actual) {
          agrupadasPuntuales.set(t.medicamento_id, {
            nombre: t.medicamento_nombre,
            dosisStr,
            conteo: 1,
            ultimaFechaMs: fechaMs,
          });
        } else {
          actual.conteo += 1;
          if (fechaMs > actual.ultimaFechaMs) {
            actual.ultimaFechaMs = fechaMs;
          }
        }
      }

      for (const item of agrupadasPuntuales.values()) {
        const haceStr = formatearTiempoRelativo(ahoraMs, item.ultimaFechaMs);
        vinetasPuntuales.push(
          `  * ${item.nombre} | Dosis: ${item.dosisStr} | ${item.conteo} ${
            item.conteo === 1 ? 'toma puntual' : 'tomas puntuales'
          } (última ${haceStr})`
        );
      }
    }

    // 4. Variaciones farmacologicas en los ultimos 30 dias (altas y bajas)
    const cambios30d: string[] = [];
    for (const p of todasPlanificaciones) {
      if (p.fecha_inicio) {
        const iniMs = new Date(p.fecha_inicio).getTime();
        if (!isNaN(iniMs) && iniMs >= hace30dMs) {
          const fechaCorta = new Date(iniMs).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
          });
          cambios30d.push(`Alta de ${p.medicamento_nombre} (${fechaCorta})`);
        }
      }
      if (p.fecha_fin) {
        const finMs = new Date(p.fecha_fin).getTime();
        if (!isNaN(finMs) && finMs >= hace30dMs && finMs <= ahoraMs) {
          const fechaCorta = new Date(finMs).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
          });
          cambios30d.push(`Fin de pauta de ${p.medicamento_nombre} (${fechaCorta})`);
        }
      }
    }

    const listadoFarmacosActivos =
      (!filtros || filtros.incluirFarmacosActivos) && vinetasFarmacos.length > 0
        ? vinetasFarmacos.join('\n')
        : '';

    const listadoSuplementosActivos =
      (!filtros || filtros.incluirSuplementosActivos) && vinetasSuplementos.length > 0
        ? vinetasSuplementos.join('\n')
        : '';

    const listadoTomasPuntuales14d =
      (!filtros || filtros.incluirTomasPuntuales) && vinetasPuntuales.length > 0
        ? vinetasPuntuales.join('\n')
        : '';

    const cambiosFarmacologicosRecientes =
      cambios30d.length > 0
        ? cambios30d.join('; ')
        : 'Sin modificaciones en las pautas activas.';

    return formatearModulo7Farmacologia({
      listadoFarmacosActivos,
      listadoSuplementosActivos,
      listadoTomasPuntuales14d,
      cambiosFarmacologicosRecientes,
    });
  } catch (error) {
    console.error('Error al compilar el Modulo 7 de farmacologia:', error);
    return formatearModulo7Farmacologia({
      listadoFarmacosActivos: '',
      listadoSuplementosActivos: '',
      listadoTomasPuntuales14d: '',
      cambiosFarmacologicosRecientes: 'Sin modificaciones en las pautas activas.',
    });
  }
};

