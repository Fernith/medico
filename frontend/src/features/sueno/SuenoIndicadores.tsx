import React, { useMemo } from 'react';
import { type SuenoDB, formatMinutos, getChartY } from '../../utils/suenoCalculations';
import { useAjustes } from '../../context/AjustesContext';

interface SuenoIndicadoresProps {
  data: SuenoDB[];
  rango: '7d' | '14d' | '1m' | '3m' | '6m' | 'custom';
  customDias: number | '';
}

export const SuenoIndicadores: React.FC<SuenoIndicadoresProps> = ({ data, rango, customDias }) => {
  const { ajustes } = useAjustes();
  
  const objHoras = Number(ajustes['objetivo_horas_sueno']) || 8;
  const limiteDeuda = Number(ajustes['limite_deuda_sueno']) || 5;

  // Formateador visual para saber qué poner en la etiqueta dinámica
  const rangoLabel = useMemo(() => {
    if (rango === '7d') return '7 Días';
    if (rango === '14d') return '14 Días';
    if (rango === '1m') return '1 Mes';
    if (rango === '3m') return '3 Meses';
    if (rango === '6m') return '6 Meses';
    if (rango === 'custom') return `${customDias || 7} Días`;
    return '';
  }, [rango, customDias]);

  const { deudaData, jetlagData, devData, avgData } = useMemo(() => {
    // 1. DEUDA DE SUEÑO (Últimos 14 días fijos)
    const fecha14d = new Date();
    fecha14d.setHours(0,0,0,0);
    fecha14d.setDate(fecha14d.getDate() - 14);
    
    const data14d = data.filter(d => new Date(d.fecha) >= fecha14d);
    let deudaHrs = 0;
    if (data14d.length > 0) {
      const objetivoTotal = data14d.length * objHoras;
      const dormidoTotal = data14d.reduce((sum, d) => sum + (d.minutos_sueno / 60), 0);
      deudaHrs = objetivoTotal - dormidoTotal;
    }

    // 2. JETLAG SOCIAL (Últimos 7 días fijos)
    const fecha7d = new Date();
    fecha7d.setHours(0,0,0,0);
    fecha7d.setDate(fecha7d.getDate() - 7);
    
    const data7d = data.filter(d => new Date(d.fecha) >= fecha7d);
    const midpointsWeekday: number[] = [];
    const midpointsWeekend: number[] = [];
    
    data7d.forEach(d => {
      const start = getChartY(d.hora_inicio);
      const end = getChartY(d.hora_fin);
      if (start !== null && end !== null) {
        const mid = (start + end) / 2;
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

    // 3 y 4. DINÁMICOS (Según rango del selector)
    let diasFiltro = 7;
    if (rango === '14d') diasFiltro = 14;
    else if (rango === '1m') diasFiltro = 30;
    else if (rango === '3m') diasFiltro = 90;
    else if (rango === '6m') diasFiltro = 180;
    else if (rango === 'custom') diasFiltro = Number(customDias) || 7;

    const fechaFiltro = new Date();
    fechaFiltro.setHours(0,0,0,0);
    fechaFiltro.setDate(fechaFiltro.getDate() - diasFiltro);
    
    const dataFiltro = data.filter(d => new Date(d.fecha) >= fechaFiltro);
    
    let mediaDormidoMs = 0;
    let desviacionEstandarMs = 0;
    
    if (dataFiltro.length > 0) {
      mediaDormidoMs = dataFiltro.reduce((sum, d) => sum + d.minutos_sueno, 0) / dataFiltro.length;
      
      const midpoints = dataFiltro.map(d => {
        const s = getChartY(d.hora_inicio);
        const e = getChartY(d.hora_fin);
        return s !== null && e !== null ? (s + e) / 2 : null;
      }).filter((m): m is number => m !== null);

      if (midpoints.length > 1) {
        const meanMid = midpoints.reduce((a,b)=>a+b, 0) / midpoints.length;
        const variance = midpoints.reduce((sum, m) => sum + Math.pow(m - meanMid, 2), 0) / midpoints.length;
        desviacionEstandarMs = Math.sqrt(variance) * 60; 
      }
    }

    return { deudaData: deudaHrs, jetlagData: jetlagMs, devData: desviacionEstandarMs, avgData: mediaDormidoMs };
  }, [data, rango, customDias, objHoras]);

  // UI helpers para Deuda
  const isDeudaPeligrosa = deudaData > limiteDeuda;
  const isDeudaAceptable = deudaData > 0 && deudaData <= limiteDeuda;

  // Clases de Tailwind generadas según el estado
  const bgDeuda = isDeudaPeligrosa ? 'bg-red-50 border-red-200' : isDeudaAceptable ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200';
  const textTitleDeuda = isDeudaPeligrosa ? 'text-red-500' : isDeudaAceptable ? 'text-blue-500' : 'text-emerald-500';
  const textValueDeuda = isDeudaPeligrosa ? 'text-red-700' : isDeudaAceptable ? 'text-blue-700' : 'text-emerald-700';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
      
      {/* 1. DEUDA DE SUEÑO (FIJO) */}
      <div className={`p-5 rounded-3xl shadow-sm border relative overflow-hidden ${bgDeuda}`}>
        <div className="flex justify-between items-start mb-1">
          <p className={`text-xs font-bold uppercase tracking-widest ${textTitleDeuda}`}>Deuda de Sueño</p>
          <span title="Valor fijo no afectado por la gráfica" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 text-slate-500 flex items-center gap-1">
            📌 Fijo 14d
          </span>
        </div>
        <p className={`text-2xl font-black ${textValueDeuda}`}>
          {deudaData <= 0 ? 'Sin Deuda 🎉' : formatMinutos(Math.round(deudaData * 60))}
        </p>
      </div>

      {/* 2. JETLAG SOCIAL (FIJO) */}
      <div className="bg-slate-50 p-5 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Jetlag Social</p>
          <span title="Valor fijo no afectado por la gráfica" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 text-slate-500 flex items-center gap-1">
            📌 Fijo 7d
          </span>
        </div>
        <p className="text-2xl font-black text-slate-800">
          {jetlagData === null ? '--' : formatMinutos(Math.round(jetlagData))}
        </p>
      </div>

      {/* 3. DESVIACIÓN DEL PUNTO MEDIO (DINÁMICO) */}
      <div className="bg-indigo-50/50 p-5 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Desviación Media</p>
          <span title="Vinculado a la gráfica" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 flex items-center gap-1">
            📊 {rangoLabel}
          </span>
        </div>
        <p className="text-2xl font-black text-indigo-900">
          {devData === 0 ? '--' : `± ${formatMinutos(Math.round(devData))}`}
        </p>
      </div>

      {/* 4. MEDIA DE HORAS NOCTURNAS (DINÁMICO) */}
      <div className="bg-indigo-50/50 p-5 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Media Nocturna</p>
          <span title="Vinculado a la gráfica" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 flex items-center gap-1">
            📊 {rangoLabel}
          </span>
        </div>
        <p className="text-2xl font-black text-indigo-900">
          {avgData === 0 ? '--' : formatMinutos(Math.round(avgData))}
        </p>
      </div>

    </div>
  );
};