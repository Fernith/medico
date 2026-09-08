import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type MedicionDB, calcularICC, calcularICE } from '../../utils/medicionCalculations';

interface MedidasGraficaProps {
  data: MedicionDB[];
  altura: number;
  sexo: 'Masculino' | 'Femenino';
}

// 1. Tarjeta Elegante Compartida
const MedidasInfoCard = ({ data, isTooltip = false }: { data: any, isTooltip?: boolean }) => {
  if (!data) return null;
  
  return (
    <div className={isTooltip 
      ? "bg-white p-4 rounded-3xl shadow-xl border border-rose-50 text-center min-w-[200px]" 
      : "w-full animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center text-center"
    }>
      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
        {new Date(data.timestamp).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>
      
      <div className="flex gap-2 w-full max-w-[280px]">
        {data.ice !== undefined && (
          <div className="flex-1 bg-sky-50/80 rounded-2xl p-3 border border-sky-100/50">
            <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">ICE</p>
            <p className="text-2xl font-black text-sky-600 leading-none">{data.ice.toFixed(2)}</p>
          </div>
        )}
        {data.icc !== undefined && (
          <div className="flex-1 bg-violet-50/80 rounded-2xl p-3 border border-violet-100/50">
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">ICC</p>
            <p className="text-2xl font-black text-violet-600 leading-none">{data.icc.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. El "Caballo de Troya"
const SyncTooltip = ({ active, payload, onUpdate }: any) => {
  useEffect(() => {
    if (active && payload && payload.length) {
      onUpdate(payload[0].payload);
    }
  }, [active, payload, onUpdate]);

  if (active && payload && payload.length) {
    return (
      <div className="hidden sm:block">
        <MedidasInfoCard data={payload[0].payload} isTooltip={true} />
      </div>
    );
  }
  return null;
};

export const MedidasGrafica: React.FC<MedidasGraficaProps> = ({ data, altura, sexo }) => {
  const [selectedData, setSelectedData] = useState<any | null>(null);

  const { chartData, yMin, yMax } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], yMin: 0.3, yMax: 1.2 };
    
    const procesado = [...data].reverse().map(d => {
      const punto: any = { timestamp: new Date(d.fecha).getTime() };
      if (d.cm_cintura) {
        punto.ice = calcularICE(d.cm_cintura, altura);
        if (d.cm_cadera) {
          punto.icc = calcularICC(d.cm_cintura, d.cm_cadera);
        }
      }
      return punto;
    }).filter(p => p.ice !== undefined); 

    const allValues = procesado.flatMap(d => [d.ice, d.icc]).filter(v => v !== undefined && v !== null) as number[];
    
    if (allValues.length === 0) return { chartData: procesado, yMin: 0.3, yMax: 1 };

    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);

    const minCalc = Math.max(0, dataMin - 0.02);
    const maxCalc = dataMax + 0.02;

    return { 
      chartData: procesado, 
      yMin: parseFloat(minCalc.toFixed(2)), 
      yMax: parseFloat(maxCalc.toFixed(2)) 
    };
  }, [data, altura]);

  // Autoselección inicial
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setSelectedData(chartData[chartData.length - 1]);
    }
  }, [chartData]);

  const handleUpdate = useCallback((newData: any) => {
    setSelectedData((prev: any) => {
      if (!prev || prev.timestamp !== newData.timestamp) return newData;
      return prev;
    });
  }, []);

  const limiteICC = sexo === 'Masculino' ? 0.90 : 0.85;
  const limiteICE = 0.5;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 flex flex-col h-auto sm:h-[420px]">
      <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 shrink-0">
        <span className="text-rose-500">📏</span> Evolución de Índices (ICE / ICC)
      </h2>
      
      <div className="h-[200px] sm:flex-1 w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time"
              domain={['dataMin', 'dataMax']} 
              tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' })}
              stroke="#94a3b8" fontSize={12} minTickGap={20}
            />
            
            <YAxis domain={[yMin, yMax]} stroke="#94a3b8" fontSize={12} />
            
            {/* Tooltip espía */}
            <Tooltip 
              cursor={{stroke: '#ffe4e6', strokeWidth: 2}} 
              content={<SyncTooltip onUpdate={handleUpdate} />}
            />
            
            {/* Líneas de peligro */}
            <ReferenceLine y={limiteICE} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Riesgo ICE', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine y={limiteICC} stroke="#e11d48" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Riesgo ICC', fill: '#e11d48', fontSize: 10 }} />
            
            <Line type="monotone" dataKey="ice" stroke="#0ea5e9" strokeWidth={3} name="ICE" dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="icc" stroke="#8b5cf6" strokeWidth={3} name="ICC" dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Panel Móvil */}
      <div className="sm:hidden mt-4 pt-4 border-t border-slate-100 flex-1 flex justify-center">
        {selectedData ? (
          <MedidasInfoCard data={selectedData} isTooltip={false} />
        ) : (
          <p className="text-center text-slate-400 text-sm font-medium py-4">Toca un día para ver detalles</p>
        )}
      </div>
    </div>
  );
};