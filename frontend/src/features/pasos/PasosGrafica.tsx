import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine, Label } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { type ChartDataPoint, calcularDistanciaKm } from '../../utils/pasosCalculations';

interface PasosGraficaProps {
  data: ChartDataPoint[];
  viewMode: 'S' | 'M' | 'A';
  setViewMode: (v: 'S' | 'M' | 'A') => void;
  refDate: Date;
  setRefDate: (d: Date) => void;
  startPeriod: Date;
  endPeriod: Date;
  alturaCm: number;
  sexo: string;
  objetivoDiario: number;
}

const CustomTooltip = ({ active, payload, alturaCm, sexo }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pasos = data.valor;
    const distancia = calcularDistanciaKm(pasos, alturaCm, sexo);
    
    const dateText = data.isMonth 
      ? `Mes: ${data.name}` 
      : (data.fullDate ? new Date(data.fullDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }) : data.name);

    return (
      <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 text-center min-w-[160px] animate-in zoom-in-95 duration-200">
        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{dateText}</p>
        
        <div className="bg-orange-50/80 rounded-2xl p-3 mb-2 border border-orange-100/50">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Pasos</p>
          <p className="text-3xl font-black text-orange-600 leading-none">{pasos.toLocaleString('es-ES')}</p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Distancia</p>
          <p className="text-sm font-black text-slate-700 leading-none">{distancia.toFixed(2)} km</p>
        </div>
      </div>
    );
  }
  return null;
};

// NUEVO: Etiqueta personalizada para incrustar el valor de la meta en el Eje Y
const MetaYAxisLabel = (props: any) => {
  const { viewBox, value } = props;
  // Ajustamos la posición X para que se alinee con los ticks normales del eje Y
  const x = viewBox.x - 8; 
  const y = viewBox.y;
  
  // Formateo compacto para que no ocupe mucho (ej. 8000 -> 8k, 240000 -> 240k)
  const formatVal = value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : value;

  return (
    <g>
      {/* Fondo blanco sutilmente redondeado para tapar cualquier tick gris estándar que coincida en la misma altura */}
      <rect x={x - 42} y={y - 11} width={46} height={22} fill="#ffffff" rx={4} />
      <text x={x} y={y} fill="#f97316" fontSize={12} fontWeight="900" textAnchor="end" dominantBaseline="central">
        {formatVal}
      </text>
    </g>
  );
};

export const PasosGrafica: React.FC<PasosGraficaProps> = ({ 
  data, viewMode, setViewMode, refDate, setRefDate, startPeriod, endPeriod, alturaCm, sexo, objetivoDiario 
}) => {
  const hoy = new Date();
  const currentYear = hoy.getFullYear();
  const currentMonth = hoy.getMonth();

  const handlePrev = () => {
    const d = new Date(refDate);
    if (viewMode === 'S') d.setDate(d.getDate() - 7);
    else if (viewMode === 'M') d.setMonth(d.getMonth() - 1);
    else d.setFullYear(d.getFullYear() - 1);
    setRefDate(d);
  };

  const handleNext = () => {
    const d = new Date(refDate);
    if (viewMode === 'S') d.setDate(d.getDate() + 7);
    else if (viewMode === 'M') d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    
    if (d > hoy) setRefDate(new Date());
    else setRefDate(d);
  };

  const mesesFull = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const maxMesPermitido = refDate.getFullYear() === currentYear ? currentMonth : 11;
  const mesesDisponibles = mesesFull.slice(0, maxMesPermitido + 1);

  const startYear = 2024;
  const yearsAvailable = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

  // LÓGICA DE META: Si es año, calculamos la media mensual. Si es S/M, es la diaria.
  const metaLine = viewMode === 'A' ? Math.round(objetivoDiario * 30.416) : objetivoDiario;
  
  // LÓGICA DE YAXIS: Redondeo inteligente del límite superior de la gráfica
  const yMax = useMemo(() => {
    const defaultMax = viewMode === 'A' ? Math.ceil((metaLine + 10000) / 10000) * 10000 : Math.ceil((metaLine + 500) / 500) * 500;
    if (!data || data.length === 0) return defaultMax;
    
    const maxDataVal = Math.max(...data.map(d => d.valor));
    const maxVal = Math.max(maxDataVal, metaLine);
    
    if (viewMode === 'A') {
      // Redondeo de 10.000 en 10.000 para la vista mensual, ya que son números muy altos
      return Math.ceil((maxVal + 10000) / 10000) * 10000;
    } else {
      // Redondeo de 500 en 500 para la vista diaria
      return Math.ceil((maxVal + 500) / 500) * 500;
    }
  }, [data, metaLine, viewMode]);

  const renderSelectorFechas = () => {
    if (viewMode === 'S') {
      return <span className="px-3 text-sm font-bold text-slate-600">{startPeriod.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit'})} - {endPeriod.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit'})}</span>;
    }
    
    if (viewMode === 'M') {
      return (
        <div className="flex items-center gap-1 px-2">
          <select 
            value={refDate.getMonth()} 
            onChange={(e) => { const d = new Date(refDate); d.setMonth(Number(e.target.value)); setRefDate(d); }}
            className="bg-slate-100 hover:bg-orange-50 focus:bg-orange-50 font-bold text-slate-500 hover:text-orange-600 focus:ring-2 focus:ring-orange-200 outline-none cursor-pointer rounded-lg px-2 py-1 transition-all"
          >
            {mesesDisponibles.map((m, i) => <option key={i} value={i} className="text-slate-700">{m}</option>)}
          </select>
          <select 
            value={refDate.getFullYear()} 
            onChange={(e) => { 
              const d = new Date(refDate); 
              const y = Number(e.target.value);
              d.setFullYear(y);
              if (y === currentYear && d.getMonth() > currentMonth) d.setMonth(currentMonth);
              setRefDate(d); 
            }}
            className="bg-slate-100 hover:bg-orange-50 focus:bg-orange-50 font-bold text-slate-500 hover:text-orange-600 focus:ring-2 focus:ring-orange-200 outline-none cursor-pointer rounded-lg px-2 py-1 transition-all"
          >
            {yearsAvailable.map(y => <option key={y} value={y} className="text-slate-700">{y}</option>)}
          </select>
        </div>
      );
    }

    if (viewMode === 'A') {
      return (
        <select 
          value={refDate.getFullYear()} 
          onChange={(e) => { const d = new Date(refDate); d.setFullYear(Number(e.target.value)); setRefDate(d); }}
          className="bg-slate-100 hover:bg-orange-50 focus:bg-orange-50 font-bold text-slate-500 hover:text-orange-600 focus:ring-2 focus:ring-orange-200 outline-none px-4 py-1.5 cursor-pointer rounded-xl transition-all"
        >
          {yearsAvailable.map(y => <option key={y} value={y} className="text-slate-700">{y}</option>)}
        </select>
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-100">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-max border border-slate-200 shrink-0">
          {['S', 'M', 'A'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode as any)} className={`flex-1 sm:flex-none sm:px-8 py-2 font-black text-sm rounded-lg transition-all ${viewMode === mode ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}>
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
          <button onClick={handlePrev} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
          <div className="relative flex items-center min-w-[130px] justify-center">{renderSelectorFechas()}</div>
          <button onClick={handleNext} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => setRefDate(new Date())} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-orange-500" title="Ir a hoy"><CalendarIcon className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* Hemos añadido padding para asegurar que la etiqueta Y (left: 10) se vea entera si el número crece */}
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
            
            {/* Eje Y estándar de Recharts */}
            <YAxis domain={[0, yMax]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
            
            <Tooltip 
              cursor={{fill: '#fff7ed'}} 
              wrapperStyle={{ zIndex: 1000, outline: 'none' }}
              content={<CustomTooltip alturaCm={alturaCm} sexo={sexo} />}
            />

            {/* LÍNEA DE META CON DOBLE ETIQUETA */}
            <ReferenceLine 
              y={metaLine} 
              stroke="#f97316" 
              strokeDasharray="4 4" 
              strokeWidth={2}
            >
              {/* Etiqueta interna en la barra */}
              <Label position="insideTopLeft" value={viewMode === 'A' ? 'Meta Mensual' : 'Meta'} fill="#f97316" fontSize={11} fontWeight="bold" />
              {/* Etiqueta externa inyectada como tick del Eje Y */}
              <Label content={<MetaYAxisLabel value={metaLine} />} />
            </ReferenceLine>

            <Bar dataKey="valor" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};