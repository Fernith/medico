import { apiFetch } from '../../api/client';
import {
  type Ciclo,
  addDays,
  generarMapaEstados,
} from '../reglaCalculations';
import { formatearModulo6Ciclo } from '../../features/usuario/prompts/promptModularTemplate';

const parseFechaLocal = (str: string): Date => {
  const [y, m, d] = str.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatFechaLocal = (date: Date): string => {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

/**
 * Compila y formatea el Modulo 6: Ciclo Menstrual y Estado Hormonal.
 * Reutiliza Ciclo, addDays y generarMapaEstados de reglaCalculations.ts.
 */
export const compilarModulo6CicloMenstrual = async (): Promise<string> => {
  try {
    const [resCiclos, resAjustes] = await Promise.allSettled([
      apiFetch('/api/ciclos').then((r) =>
        r.ok ? (r.json() as Promise<Ciclo[]>) : Promise.resolve([])
      ),
      apiFetch('/api/ajustes').then((r) =>
        r.ok
          ? (r.json() as Promise<Record<string, string>>)
          : Promise.resolve({} as Record<string, string>)
      ),
    ]);

    const ciclos: Ciclo[] =
      resCiclos.status === 'fulfilled' && Array.isArray(resCiclos.value)
        ? resCiclos.value
        : [];

    if (ciclos.length === 0) {
      return formatearModulo6Ciclo({
        cicloDiaActual: '--',
        cicloFaseActual: 'Sin registros',
        cicloDuracionMediaDias: '--',
        cicloDesviacionDias: '--',
        cicloRegularidadEstado: '--',
      });
    }

    const ajustes: Record<string, string> =
      resAjustes.status === 'fulfilled' && resAjustes.value ? resAjustes.value : {};
    const mediaCicloAjuste = Number(ajustes['duracion_media_ciclo']) || 28;
    const mediaPeriodoAjuste = Number(ajustes['duracion_media_periodo']) || 6;

    // Ordenar cronologicamente de mas antiguo a mas reciente
    const ciclosAsc = [...ciclos].sort(
      (a, b) =>
        parseFechaLocal(a.fecha_inicio).getTime() -
        parseFechaLocal(b.fecha_inicio).getTime()
    );

    // 1. Calcular duraciones de los intervalos de ciclo completos (inicio[i] -> inicio[i+1])
    const duracionesCiclos: number[] = [];
    for (let i = 0; i < ciclosAsc.length - 1; i++) {
      const inicioActual = parseFechaLocal(ciclosAsc[i].fecha_inicio);
      const inicioSiguiente = parseFechaLocal(ciclosAsc[i + 1].fecha_inicio);
      const dias = Math.round(
        (inicioSiguiente.getTime() - inicioActual.getTime()) / (1000 * 3600 * 24)
      );
      if (dias > 0) {
        duracionesCiclos.push(dias);
      }
    }

    // Tomar los ultimos 3 a 6 ciclos completos (hasta un maximo de 6)
    const ultimosCiclos = duracionesCiclos.slice(-6);

    let mediaCicloNum = mediaCicloAjuste;
    let cicloDuracionMediaDias: number | string = mediaCicloAjuste;
    let cicloDesviacionDias: number | string = '0.0';
    let cicloRegularidadEstado = 'Datos insuficientes (< 2 ciclos)';

    if (ultimosCiclos.length > 0) {
      const suma = ultimosCiclos.reduce((acc, d) => acc + d, 0);
      const mediaExacta = suma / ultimosCiclos.length;
      mediaCicloNum = Math.round(mediaExacta);
      cicloDuracionMediaDias = mediaCicloNum;

      const varianza =
        ultimosCiclos.reduce((acc, d) => acc + Math.pow(d - mediaExacta, 2), 0) /
        ultimosCiclos.length;
      const sigma = Math.sqrt(varianza);
      cicloDesviacionDias = sigma.toFixed(1);
      cicloRegularidadEstado = sigma <= 3 ? 'Regular' : 'Irregular';
    }

    // Calcular duracion media real del sangrado para pasarlo a generarMapaEstados
    let mediaPeriodoNum = mediaPeriodoAjuste;
    const ciclosConFin = ciclosAsc.filter((c) => c.fecha_fin !== null);
    if (ciclosConFin.length > 0) {
      const sumaPeriodos = ciclosConFin.reduce((acc, c) => {
        const ini = parseFechaLocal(c.fecha_inicio);
        const fin = parseFechaLocal(c.fecha_fin as string);
        return acc + Math.round((fin.getTime() - ini.getTime()) / (1000 * 3600 * 24)) + 1;
      }, 0);
      mediaPeriodoNum = Math.max(1, Math.round(sumaPeriodos / ciclosConFin.length));
    }

    // 2. CICLO_DIA_ACTUAL: (Dia actual - Fecha ultimo inicio sangrado) + 1
    const now = new Date();
    const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ultimoCiclo = ciclosAsc[ciclosAsc.length - 1];
    const fechaUltimoInicio = parseFechaLocal(ultimoCiclo.fecha_inicio);

    const cicloDiaActual =
      Math.round((hoy.getTime() - fechaUltimoInicio.getTime()) / (1000 * 3600 * 24)) + 1;

    // 3. CICLO_FASE_ACTUAL reutilizando generarMapaEstados y addDays de reglaCalculations.ts
    const mapaEstados = generarMapaEstados(
      ciclosAsc,
      mediaCicloNum,
      mediaPeriodoNum,
      hoy.getFullYear() + 1
    );

    const hoyStr = formatFechaLocal(hoy);
    const ayerStr = formatFechaLocal(addDays(hoy, -1));
    const mananaStr = formatFechaLocal(addDays(hoy, 1));

    const diaOvulacionEstimado = Math.max(mediaPeriodoNum + 2, mediaCicloNum - 14);
    let cicloFaseActual = 'Folicular';

    if (mapaEstados[hoyStr] === 'periodo_real') {
      cicloFaseActual = 'Folicular temprana (Menstrual)';
    } else if (
      mapaEstados[hoyStr] === 'ovulacion' ||
      mapaEstados[ayerStr] === 'ovulacion' ||
      mapaEstados[mananaStr] === 'ovulacion' ||
      (cicloDiaActual >= diaOvulacionEstimado - 1 &&
        cicloDiaActual <= diaOvulacionEstimado + 1)
    ) {
      cicloFaseActual = 'Ovulatoria';
    } else if (cicloDiaActual < diaOvulacionEstimado - 1) {
      cicloFaseActual = 'Folicular';
    } else if (cicloDiaActual <= mediaCicloNum - 4) {
      cicloFaseActual = 'Lútea';
    } else {
      cicloFaseActual = 'Lútea tardía / Pre-menstrual';
    }

    return formatearModulo6Ciclo({
      cicloDiaActual,
      cicloFaseActual,
      cicloDuracionMediaDias,
      cicloDesviacionDias,
      cicloRegularidadEstado,
    });
  } catch (error) {
    console.error('Error al compilar el Modulo 6 de ciclo menstrual:', error);
    return formatearModulo6Ciclo({
      cicloDiaActual: '--',
      cicloFaseActual: '--',
      cicloDuracionMediaDias: '--',
      cicloDesviacionDias: '--',
      cicloRegularidadEstado: '--',
    });
  }
};

