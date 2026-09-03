import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type SuenoDB, formatMinutos, getChartY } from '../../utils/suenoCalculations';

interface SuenoHorarioGraficaProps {
  data: SuenoDB[];
  rango: '7d' | '14d' | '1m' | '3m' | '6m' | 'custom';
  setRango: (rango: '7d' | '14d' | '1m' | '3m' | '6m' | 'custom') => void;
  customDias: number | '';
  setCustomDias: (dias: number | '') => void;
}

export const SuenoHorarioGrafica: React.FC<SuenoHorarioGraficaProps> = ({ 
  data, 
  rango, 
  setRango, 
  customDias, 
  setCustomDias 
}) => {

  const { chartData, yDomain, yTicks } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], yDomain: [14, 38], yTicks: [] };

    let dias = 7;
    if (rango === '14d') dias = 14;
    else if (rango === '1m') dias = 30;
    else if (rango === '3m') dias = 90;
    else if (rango === '6m') dias = 180;
    else if (rango === 'custom') dias = Number(customDias) || 7;

    const limiteFecha = new Date();
    limiteFecha.setHours(0, 0, 0, 0);
    limiteFecha.setDate(limiteFecha.getDate() - dias);

    const filteredData = data.filter(d => new Date(d.fecha) >= limiteFecha);

    let minZoom = 38; 
    let maxZoom = 14; 

    const processed = [...filteredData].reverse().map(d => {
      const mainStart = getChartY(d.hora_inicio);
      const mainEnd = getChartY(d.hora_fin);
      const napStart = getChartY(d.siesta_hora_inicio);
      const napEnd = getChartY(d.siesta_hora_fin);

      // LÓGICA DE DIVISIÓN PARA EVITAR DESBORDAMIENTOS (Límite: 14 a 38)
      let main_range = mainStart !== null && mainEnd !== null ? [mainStart, mainEnd] : null;
      let main_range_split = null;
      if (mainStart !== null && mainEnd !== null && mainStart > mainEnd) {
        main_range = [mainStart, 38]; // Tramo hasta el final del día (abajo del todo)
        main_range_split = [14, mainEnd]; // Tramo desde el inicio del día (arriba del todo)
      }

      let nap_range = napStart !== null && napEnd !== null ? [napStart, napEnd] : null;
      let nap_range_split = null;
      if (napStart !== null && napEnd !== null && napStart > napEnd) {
        nap_range = [napStart, 38];
        nap_range_split = [14, napEnd];
      }

      let midpoint = null;
      if (mainStart !== null && mainEnd !== null) {
        if (mainStart > mainEnd) {
          let m = mainStart + ((38 - mainStart) + (mainEnd - 14)) / 2;
          if (m >= 38) m -= 24;
          midpoint = m;
        } else {
          midpoint = (mainStart + mainEnd) / 2;
        }
      }

      const allVals = [mainStart, mainEnd, napStart, napEnd].filter((v): v is number => v !== null && !isNaN(v));
      if (allVals.length > 0) {
        if (main_range_split || nap_range_split) {
          // Si hay división, forzamos a mostrar todo el lienzo para que se vea el cruce
          minZoom = 14; maxZoom = 38;
        } else {
          minZoom = Math.min(minZoom, ...allVals);
          maxZoom = Math.max(maxZoom, ...allVals);
        }
      }

      return {
        ...d,
        timestamp: new Date(d.fecha).getTime(),
        main_range,
        main_range_split,
        nap_range,
        nap_range_split,
        midpoint,
      };
    });

    if (minZoom === 38 && maxZoom === 14) {
      minZoom = 22; maxZoom = 30;
    }

    const finalMin = Math.max(14, Math.floor(minZoom) - 1); 
    const finalMax = Math.min(38, Math.ceil(maxZoom) + 1);
    
    const ticks = [];
    const startTick = finalMin % 2 === 0 ? finalMin : finalMin + 1;
    for (let i = startTick; i <= finalMax; i += 2) {
      ticks.push(i);
    }

    return { chartData: processed, yDomain: [finalMin, finalMax], yTicks: ticks };
  }, [data, rango, customDias]);

  const formatYAxis = (val: number) => {
    const h = Math.floor(val) % 24;
    return `${h.toString().padStart(2, '0')}:00`;
  };

  const formatHoraReloj = (isoStr: string | null) => {
    if (!isoStr) return '--:--';
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dbData: SuenoDB = payload[0].payload;
      return (
        <div className="bg-white p-5 rounded-3xl shadow-xl border border-indigo-50 min-w-[240px]">
          <p className="font-bold text-slate-400 mb-3 text-center uppercase tracking-wider text-xs">
            {new Date(label).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          
          <div className="flex gap-2 mb-4 border-b border-indigo-50 pb-4">
            <div className="flex-1 bg-indigo-50/50 p-2 rounded-xl text-center">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">A la cama</p>
              <p className="text-lg font-black text-indigo-900">{formatHoraReloj(dbData.hora_inicio)}</p>
            </div>
            <div className="flex-1 bg-indigo-50/50 p-2 rounded-xl text-center">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">En pie</p>
              <p className="text-lg font-black text-indigo-900">{formatHoraReloj(dbData.hora_fin)}</p>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Total Dormido</p>
            <p className="text-3xl font-black text-indigo-600 mt-1">{formatMinutos(dbData.minutos_sueno)}</p>
          </div>
          
          <div className="space-y-2 text-sm font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-300"></div>Ligero</span> <span>{formatMinutos(dbData.minutos_ligero)}</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-700"></div>Profundo</span> <span>{formatMinutos(dbData.minutos_profundo)}</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>REM</span> <span>{formatMinutos(dbData.minutos_rem)}</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>Despierto</span> <span className="text-slate-400">{formatMinutos(dbData.minutos_despierto)}</span></div>
            
            {dbData.minutos_siesta > 0 && (
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>Siesta</span> 
                <span className="text-amber-600">{formatMinutos(dbData.minutos_siesta)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-50 h-[550px] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
          <span className="text-indigo-500">🛌</span> Horario y Regularidad
        </h2>
        
        <div className="flex items-center p-1 bg-slate-100 rounded-lg w-max">
          {['7d', '14d', '1m', '3m', '6m'].map((r) => (
            <button
              key={r}
              onClick={() => setRango(r as any)}
              className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${rango === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {r}
            </button>
          ))}
          <div className={`flex items-center ml-1 px-2 py-1.5 rounded-md transition-all ${rango === 'custom' ? 'bg-white shadow-sm' : ''}`}>
            <input
              type="number"
              value={customDias}
              onChange={(e) => {
                setRango('custom');
                setCustomDias(e.target.value === '' ? '' : Number(e.target.value));
              }}
              placeholder="X"
              className="w-10 text-center bg-transparent outline-none font-bold text-indigo-600 placeholder:text-slate-400 text-sm"
              min="1"
            />
            <span className={`text-sm font-bold ml-1 ${rango === 'custom' ? 'text-indigo-600' : 'text-slate-500'}`}>d</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time"
              domain={['dataMin', 'dataMax']} 
              tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              stroke="#94a3b8" fontSize={12} minTickGap={30} tickMargin={15} axisLine={false} tickLine={false}
              padding={{ left: 40, right: 40 }}
            />
            
            <YAxis 
              domain={yDomain} 
              allowDataOverflow={true}
              reversed={true} 
              tickFormatter={formatYAxis} 
              ticks={yTicks} 
              stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            
            <Bar dataKey="nap_range" fill="#fbbf24" radius={[6, 6, 6, 6]} barSize={16} name="Siesta" stackId="a" />
            <Bar dataKey="nap_range_split" fill="#fbbf24" radius={[6, 6, 6, 6]} barSize={16} stackId="a" />
            
            <Bar dataKey="main_range" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={24} name="Sueño Nocturno" stackId="b" />
            <Bar dataKey="main_range_split" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={24} stackId="b" />
            
            <Line 
              type="monotone" 
              dataKey="midpoint" 
              stroke="#f43f5e" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
              activeDot={{ r: 6 }} 
              name="Media Nocturna" 
              connectNulls={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};