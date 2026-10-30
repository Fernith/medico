import { apiFetch } from '../../api/client';
import {
  type SuenoDB,
  calcularIndicadoresSueno,
  formatMinutos,
  getChartY,
} from '../suenoCalculations';
import { formatearModulo5Sueno } from '../../features/usuario/prompts/promptModularTemplate';

/**
 * Compila y formatea el Modulo 5: Sueno y Ritmos Circadianos.
 * Reutiliza calcularIndicadoresSueno, formatMinutos y getChartY de suenoCalculations.ts.
 */
export const compilarModulo5Sueno = async (): Promise<string> => {
  try {
    const [resSueno, resAjustes] = await Promise.allSettled([
      apiFetch('/api/sueno').then((r) =>
        r.ok ? (r.json() as Promise<SuenoDB[]>) : Promise.resolve([])
      ),
      apiFetch('/api/ajustes').then((r) =>
        r.ok
          ? (r.json() as Promise<Record<string, string>>)
          : Promise.resolve({} as Record<string, string>)
      ),
    ]);

    const suenos: SuenoDB[] =
      resSueno.status === 'fulfilled' && Array.isArray(resSueno.value)
        ? resSueno.value
        : [];

    if (suenos.length === 0) {
      return formatearModulo5Sueno({
        suenoMedia30d: '--',
        suenoMin30d: '--',
        suenoMax30d: '--',
        suenoMedia7d: '--',
        deudaSueno14d: '--',
        suenoDesviacionInicio: '--',
        jetlagSocial: '--',
        pctSuenoProfundo30d: '--',
        pctSuenoRem30d: '--',
      });
    }

    const ajustes: Record<string, string> =
      resAjustes.status === 'fulfilled' && resAjustes.value ? resAjustes.value : {};
    const objHoras = Number(ajustes['objetivo_horas_sueno']) || 8;

    // 1. Indicadores existentes en suenoCalculations (30d y 7d)
    const indicadores30d = calcularIndicadoresSueno(suenos, '1m', '', objHoras);
    const indicadores7d = calcularIndicadoresSueno(suenos, '7d', '', objHoras);

    const suenoMedia30d =
      indicadores30d.avgData > 0
        ? formatMinutos(Math.round(indicadores30d.avgData))
        : '--';
    const suenoMedia7d =
      indicadores7d.avgData > 0
        ? formatMinutos(Math.round(indicadores7d.avgData))
        : '--';

    // Deuda de sueno acumulada (14 dias fijos con credito de siesta en suenoCalculations)
    const deudaMinutos = Math.max(0, Math.round(indicadores30d.deudaData * 60));
    const deudaSueno14d = formatMinutos(deudaMinutos);

    // Jetlag social (en horas y minutos via formatMinutos)
    const jetlagSocial =
      indicadores30d.jetlagData !== null
        ? formatMinutos(Math.round(indicadores30d.jetlagData))
        : '--';

    // 2. Ventana de 30 dias para min/max, desviacion de inicio y composicion de fases
    const fecha30d = new Date();
    fecha30d.setHours(0, 0, 0, 0);
    fecha30d.setDate(fecha30d.getDate() - 30);

    const data30d = suenos.filter((d) => new Date(d.fecha) >= fecha30d);

    let suenoMin30d = '--';
    let suenoMax30d = '--';
    let suenoDesviacionInicio = '--';
    let pctSuenoProfundo30d: number | string = '--';
    let pctSuenoRem30d: number | string = '--';

    if (data30d.length > 0) {
      const minutosValidos = data30d
        .map((d) => d.minutos_sueno)
        .filter((m) => m > 0);

      if (minutosValidos.length > 0) {
        const minMins = Math.min(...minutosValidos);
        const maxMins = Math.max(...minutosValidos);
        suenoMin30d = formatMinutos(Math.round(minMins));
        suenoMax30d = formatMinutos(Math.round(maxMins));
      }

      // Desviacion estandar (sigma) en minutos de la hora de acostarse (usando getChartY)
      const horasInicio = data30d
        .map((d) => getChartY(d.hora_inicio))
        .filter((h): h is number => h !== null);

      if (horasInicio.length > 1) {
        const mediaInicio =
          horasInicio.reduce((acc, h) => acc + h, 0) / horasInicio.length;
        const varianza =
          horasInicio.reduce((acc, h) => acc + Math.pow(h - mediaInicio, 2), 0) /
          horasInicio.length;
        suenoDesviacionInicio = formatMinutos(Math.round(Math.sqrt(varianza) * 60));
      } else if (horasInicio.length === 1) {
        suenoDesviacionInicio = formatMinutos(0);
      }

      // Proporciones porcentuales agregadas de Sueno Profundo y REM en 30 dias
      const totalMinutosSueno = data30d.reduce(
        (acc, d) => acc + (d.minutos_sueno || 0),
        0
      );
      const totalMinutosProfundo = data30d.reduce(
        (acc, d) => acc + (d.minutos_profundo || 0),
        0
      );
      const totalMinutosRem = data30d.reduce(
        (acc, d) => acc + (d.minutos_rem || 0),
        0
      );

      if (totalMinutosSueno > 0) {
        pctSuenoProfundo30d = ((totalMinutosProfundo / totalMinutosSueno) * 100).toFixed(1);
        pctSuenoRem30d = ((totalMinutosRem / totalMinutosSueno) * 100).toFixed(1);
      }
    }

    return formatearModulo5Sueno({
      suenoMedia30d,
      suenoMin30d,
      suenoMax30d,
      suenoMedia7d,
      deudaSueno14d,
      suenoDesviacionInicio,
      jetlagSocial,
      pctSuenoProfundo30d,
      pctSuenoRem30d,
    });
  } catch (error) {
    console.error('Error al compilar el Modulo 5 de sueno:', error);
    return formatearModulo5Sueno({
      suenoMedia30d: '--',
      suenoMin30d: '--',
      suenoMax30d: '--',
      suenoMedia7d: '--',
      deudaSueno14d: '--',
      suenoDesviacionInicio: '--',
      jetlagSocial: '--',
      pctSuenoProfundo30d: '--',
      pctSuenoRem30d: '--',
    });
  }
};
