export interface PasoDB {
  id: string;
  fecha: string;
  cantidad: number;
  creado_en: string | null;
}

export interface ChartDataPoint {
  name: string;
  valor: number;
  fullDate?: string;
  isMonth?: boolean;
}

// 1. FÓRMULA MÉDICA DE DISTANCIA
export const calcularDistanciaKm = (pasos: number, alturaCm: number, sexo: string): number => {
  const factor = sexo.toLowerCase() === 'femenino' ? 0.413 : 0.415;
  const longitudZancadaCm = alturaCm * factor;
  return (pasos * longitudZancadaCm) / 100000;
};

// Función auxiliar para obtener YYYY-MM-DD en hora local y evitar el bug de UTC
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// NUEVO: Función para saber los días que tiene el mes actual (Para el Widget)
export const getDiasDelMes = (fecha: Date = new Date()): number => {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
};

// 2. LÓGICA DE AGRUPACIÓN PARA LA GRÁFICA
export const procesarDatosGrafica = (
  pasos: PasoDB[], 
  viewMode: 'S' | 'M' | 'A', 
  refDate: Date
): { data: ChartDataPoint[], startPeriod: Date, endPeriod: Date } => {
  
  const d = new Date(refDate);
  const data: ChartDataPoint[] = [];
  let startPeriod = new Date();
  let endPeriod = new Date();

  if (viewMode === 'S') {
    const day = d.getDay() === 0 ? 7 : d.getDay(); 
    startPeriod = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + 1);
    endPeriod = new Date(startPeriod);
    endPeriod.setDate(endPeriod.getDate() + 6);

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const curr = new Date(startPeriod);
      curr.setDate(curr.getDate() + i);
      
      const localDateStr = getLocalDateString(curr); 
      const record = pasos.find(p => p.fecha === localDateStr);
      data.push({ name: diasSemana[i], valor: record ? record.cantidad : 0, fullDate: localDateStr });
    }
  } 
  else if (viewMode === 'M') {
    startPeriod = new Date(d.getFullYear(), d.getMonth(), 1);
    endPeriod = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const daysInMonth = endPeriod.getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const curr = new Date(d.getFullYear(), d.getMonth(), i);
      const localDateStr = getLocalDateString(curr); 
      const record = pasos.find(p => p.fecha === localDateStr);
      data.push({ name: i.toString(), valor: record ? record.cantidad : 0, fullDate: localDateStr });
    }
  } 
  else if (viewMode === 'A') {
    startPeriod = new Date(d.getFullYear(), 0, 1);
    endPeriod = new Date(d.getFullYear(), 11, 31);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    for (let i = 0; i < 12; i++) {
      const mesStart = new Date(d.getFullYear(), i, 1);
      const mesEnd = new Date(d.getFullYear(), i + 1, 0);
      
      const sumaMes = pasos.reduce((acc, p) => {
        const [yearStr, monthStr, dayStr] = p.fecha.split('-');
        const pf = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr)); 
        
        if (pf >= mesStart && pf <= mesEnd) return acc + p.cantidad;
        return acc;
      }, 0);
      
      data.push({ name: meses[i], valor: sumaMes, isMonth: true });
    }
  }

  return { data, startPeriod, endPeriod };
};

// 3. LÓGICA DE INDICADORES (KPIs)
export const calcularIndicadores = (chartData: ChartDataPoint[], alturaCm: number, sexo: string) => {
  const totalPasos = chartData.reduce((sum, d) => sum + d.valor, 0);
  const totalKm = calcularDistanciaKm(totalPasos, alturaCm, sexo);

  const elementsWithData = chartData.filter(d => d.valor > 0).length;
  const avgPasos = elementsWithData > 0 ? Math.round(totalPasos / elementsWithData) : 0;
  const avgKm = elementsWithData > 0 ? calcularDistanciaKm(avgPasos, alturaCm, sexo) : 0;

  return { totalPasos, totalKm, avgPasos, avgKm };
};