export interface SuenoDB {
  fecha: string;
  minutos_sueno: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  minutos_ligero: number;
  minutos_profundo: number;
  minutos_rem: number;
  minutos_despierto: number;
  minutos_siesta: number;
  siesta_hora_inicio: string | null;
  siesta_hora_fin: string | null;
}

export const formatMinutos = (mins: number | null | undefined): string => {
  if (mins == null || isNaN(mins)) return '0 m';
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  if (h === 0) return `${m} m`;
  return `${h} h ${m.toString().padStart(2, '0')} m`;
};

export const getChartY = (dateString: string | null): number | null => {
  if (!dateString) return null;
  const d = new Date(dateString);
  const hours = d.getHours() + d.getMinutes() / 60;
  if (hours < 14) return hours + 24;
  return hours;
};

export const decimalToTimeStr = (decimal: number | string | undefined | null, fallback = "08:00"): string => {
  const num = Number(decimal);
  if (isNaN(num) || decimal == null) return fallback;
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const timeStrToDecimal = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m / 60);
};

// ==========================================
// NUEVO: MEDICINA DEL SUEÑO (SIESTAS)
// ==========================================

/**
 * Calcula los minutos "útiles" de una siesta para amortizar la deuda de sueño
 * basándose en la duración (ciclos de sueño) y la hora del día (ritmo circadiano).
 */
export const calcularCreditoSiesta = (minutosBrutos: number, horaInicioIso: string | null): number => {
  if (minutosBrutos <= 0) return 0;

  // 1. FACTOR DURACIÓN
  let fDuracion = 1.0;
  if (minutosBrutos > 30 && minutosBrutos <= 75) {
    fDuracion = 0.7; // Penalización por despertar en N3 (inercia del sueño)
  }

  // 2. FACTOR HORARIO
  let fHorario = 1.0;
  if (horaInicioIso) {
    const d = new Date(horaInicioIso);
    const horas = d.getHours() + (d.getMinutes() / 60);

    if (horas >= 15.5 && horas < 18.0) {
      fHorario = 0.8; // Interfiere ligeramente con la presión homeostática
    } else if (horas >= 18.0) {
      fHorario = 0.5; // Destruye la presión de sueño nocturna
    }
  }

  return Math.round(minutosBrutos * fDuracion * fHorario);
};

// ==========================================
// CÁLCULO DE INDICADORES (REFACTORIZADO)
// ==========================================

export const calcularIndicadoresSueno = (
  data: SuenoDB[],
  rango: '7d' | '14d' | '1m' | '3m' | '6m' | 'custom',
  customDias: number | '',
  objHoras: number
) => {
  // 1. DEUDA DE SUEÑO (Últimos 14 días fijos, APLICANDO CRÉDITO DE SIESTA)
  const fecha14d = new Date();
  fecha14d.setHours(0, 0, 0, 0);
  fecha14d.setDate(fecha14d.getDate() - 14);
  
  const data14d = data.filter(d => new Date(d.fecha) >= fecha14d);
  let deudaHrs = 0;
  
  if (data14d.length > 0) {
    const objetivoTotalMs = data14d.length * objHoras * 60;
    
    // Sumamos el sueño nocturno + el crédito neto de siestas
    const dormidoTotalMs = data14d.reduce((sum, d) => {
      const creditoSiesta = calcularCreditoSiesta(d.minutos_siesta, d.siesta_hora_inicio);
      return sum + d.minutos_sueno + creditoSiesta;
    }, 0);
    
    deudaHrs = (objetivoTotalMs - dormidoTotalMs) / 60;
  }

  // 2. JETLAG SOCIAL (Últimos 7 días fijos)
  const fecha7d = new Date();
  fecha7d.setHours(0, 0, 0, 0);
  fecha7d.setDate(fecha7d.getDate() - 7);
  
  const data7d = data.filter(d => new Date(d.fecha) >= fecha7d);
  const midpointsWeekday: number[] = [];
  const midpointsWeekend: number[] = [];
  
  data7d.forEach(d => {
    const start = getChartY(d.hora_inicio);
    const end = getChartY(d.hora_fin);
    if (start !== null && end !== null) {
      let mid = 0;
      if (start > end) {
        let m = start + ((38 - start) + (end - 14)) / 2;
        if (m >= 38) m -= 24;
        mid = m;
      } else {
        mid = (start + end) / 2;
      }
      
      const dayOfWeek = new Date(d.fecha).getDay(); 
      if (dayOfWeek === 0 || dayOfWeek === 6) midpointsWeekend.push(mid);
      else midpointsWeekday.push(mid);
    }
  });

  let jetlagMs = null;
  if (midpointsWeekday.length > 0 && midpointsWeekend.length > 0) {
    const avgWd = midpointsWeekday.reduce((a, b) => a + b, 0) / midpointsWeekday.length;
    const avgWe = midpointsWeekend.reduce((a, b) => a + b, 0) / midpointsWeekend.length;
    jetlagMs = Math.abs(avgWe - avgWd) * 60; 
  }

  // 3 y 4. DINÁMICOS (Según rango)
  let diasFiltro = 7;
  if (rango === '14d') diasFiltro = 14;
  else if (rango === '1m') diasFiltro = 30;
  else if (rango === '3m') diasFiltro = 90;
  else if (rango === '6m') diasFiltro = 180;
  else if (rango === 'custom') diasFiltro = Number(customDias) || 7;

  const fechaFiltro = new Date();
  fechaFiltro.setHours(0, 0, 0, 0);
  fechaFiltro.setDate(fechaFiltro.getDate() - diasFiltro);
  
  const dataFiltro = data.filter(d => new Date(d.fecha) >= fechaFiltro);
  
  let mediaDormidoMs = 0;
  let desviacionEstandarMs = 0;
  
  if (dataFiltro.length > 0) {
    mediaDormidoMs = dataFiltro.reduce((sum, d) => sum + d.minutos_sueno, 0) / dataFiltro.length;
    
    const midpoints = dataFiltro.map(d => {
      const s = getChartY(d.hora_inicio);
      const e = getChartY(d.hora_fin);
      if (s !== null && e !== null) {
        if (s > e) {
          let m = s + ((38 - s) + (e - 14)) / 2;
          if (m >= 38) return m - 24;
          return m;
        }
        return (s + e) / 2;
      }
      return null;
    }).filter((m): m is number => m !== null);

    if (midpoints.length > 1) {
      const meanMid = midpoints.reduce((a,b)=>a+b, 0) / midpoints.length;
      const variance = midpoints.reduce((sum, m) => sum + Math.pow(m - meanMid, 2), 0) / midpoints.length;
      desviacionEstandarMs = Math.sqrt(variance) * 60; 
    }
  }

  return { 
    deudaData: deudaHrs, 
    jetlagData: jetlagMs, 
    devData: desviacionEstandarMs, 
    avgData: mediaDormidoMs 
  };
};