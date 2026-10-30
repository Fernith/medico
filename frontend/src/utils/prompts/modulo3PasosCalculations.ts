import { apiFetch } from '../../api/client';
import { type PasoDB } from '../pasosCalculations';
import { formatearModulo3Pasos } from '../../features/usuario/prompts/promptModularTemplate';

const getLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calcula la mediana de un conjunto de numeros
 */
const calcularMediana = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 0) {
    return (ordenados[mitad - 1] + ordenados[mitad]) / 2;
  }
  return ordenados[mitad];
};

/**
 * Compila y formatea el Modulo 3: Actividad Diaria y Pasos.
 * Analiza la serie de los ultimos 30 dias (y agudo de 7 dias).
 */
export const compilarModulo3ActividadPasos = async (): Promise<string> => {
  try {
    const res = await apiFetch('/api/pasos/historial');
    const pasos: PasoDB[] = res.ok ? await res.json() : [];

    if (!Array.isArray(pasos) || pasos.length === 0) {
      return formatearModulo3Pasos({
        pasosMediana30d: '--',
        pasosMin30d: '--',
        pasosMax30d: '--',
        pasosMedia7d: '--',
        pctDiasSedentarios30d: '--',
        pasosCv30d: '--',
      });
    }

    const hoy = new Date();
    // Armar serie diaria de los ultimos 30 dias (hoy - 29 dias hasta hoy inclusive)
    const dias30: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      const fechaStr = getLocalDateString(d);
      const registros = pasos.filter((p) => p.fecha && p.fecha.slice(0, 10) === fechaStr);
      const sumaDia = registros.reduce((acc, r) => acc + (r.cantidad || 0), 0);
      dias30.push(sumaDia);
    }

    // 1. PASOS_MEDIANA_30D
    const mediana30 = Math.round(calcularMediana(dias30));

    // 2. PASOS_MIN_30D y PASOS_MAX_30D
    const min30 = Math.min(...dias30);
    const max30 = Math.max(...dias30);

    // 3. PASOS_MEDIA_7D (ultimos 7 dias del bloque de 30)
    const ultimos7 = dias30.slice(23); // indices 23..29
    const suma7d = ultimos7.reduce((acc, v) => acc + v, 0);
    const media7d = Math.round(suma7d / 7);

    // 4. PCT_DIAS_SEDENTARIOS_30D: ((Dias con pasos < 5000) / 30) * 100
    const diasSedentarios = dias30.filter((v) => v < 5000).length;
    const pctDiasSedentarios30d = ((diasSedentarios / 30) * 100).toFixed(1);

    // 5. PASOS_CV_30D: Coeficiente de variacion ((sigma / mu) * 100) de los 30 dias
    const suma30d = dias30.reduce((acc, v) => acc + v, 0);
    const media30d = suma30d / 30;

    let pasosCv30d = '0.0';
    if (media30d > 0) {
      const varianza =
        dias30.reduce((acc, v) => acc + Math.pow(v - media30d, 2), 0) / 30;
      const desviacionTipica = Math.sqrt(varianza);
      pasosCv30d = ((desviacionTipica / media30d) * 100).toFixed(1);
    }

    return formatearModulo3Pasos({
      pasosMediana30d: mediana30,
      pasosMin30d: min30,
      pasosMax30d: max30,
      pasosMedia7d: media7d,
      pctDiasSedentarios30d,
      pasosCv30d,
    });
  } catch (error) {
    console.error('Error al compilar el Modulo 3 de actividad y pasos:', error);
    return formatearModulo3Pasos({
      pasosMediana30d: '--',
      pasosMin30d: '--',
      pasosMax30d: '--',
      pasosMedia7d: '--',
      pctDiasSedentarios30d: '--',
      pasosCv30d: '--',
    });
  }
};

