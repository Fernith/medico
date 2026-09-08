import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calcularPesoParaIMC, type PesoDB } from '../../utils/pesoCalculations';

interface PesoGraficaProps {
  data: PesoDB[];
  altura: number;
}

// 1. Tarjeta Elegante Compartida
const PesoInfoCard = ({ data, isTooltip = false }: { data: any, isTooltip?: boolean }) => {
  if (!data) return null;

  return (
    <div className={isTooltip 
      ? "bg-white p-4 rounded-3xl shadow-xl border border-emerald-50 text-center min-w-[200px]" 
      : "w-full animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center text-center"
    }>
      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
        {new Date(data.timestamp).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>
      
      <div className="flex gap-2 w-full max-w-[280px]">
        {data.peso !== undefined && (
          <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-200/60">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Peso Real</p>
            <p className="text-2xl font-black text-slate-700 leading-none">{data.peso.toFixed(1)} <span className="text-xs font-bold text-slate-400">kg</span></p>
          </div>
        )}
        {data.promedio !== undefined && (
          <div className="flex-1 bg-emerald-50/80 rounded-2xl p-3 border border-emerald-100/50">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Promedio</p>
            <p className="text-2xl font-black text-emerald-600 leading-none">{data.promedio.toFixed(1)} <span className="text-xs font-bold text-emerald-400">kg</span></p>
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
        <PesoInfoCard data={payload[0].payload} isTooltip={true} />
      </div>
    );
  }
  return null;
};

export const PesoGrafica: React.FC<PesoGraficaProps> = ({ data, altura }) => {
  const [selectedData, setSelectedData] = useState<any | null>(null);

  const { chartData, yMin, yMax } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], yMin: 0, yMax: 0 };

    const cronologico = [...data].reverse().map(d => ({
      ...d,
      timestamp: new Date(d.fecha).getTime(),
    }));

    const allValues = cronologico.flatMap(d => [d.peso, d.promedio]).filter(v => v !== undefined && v !== null) as number[];
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);

    const minCalc = Math.floor(dataMin - 1);
    const maxCalc = Math.ceil(dataMax + 1);

    return { chartData: cronologico, yMin: minCalc, yMax: maxCalc };
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

  const limites = [
    { label: 'Bajo peso', imc: 18.5, color: '#3b82f6' },
    { label: 'Sobrepeso', imc: 25, color: '#056200' },
    { label: 'Ob. Moderada', imc: 30, color: '#b0b600' },
    { label: 'Ob. Grave', imc: 35, color: '#e48d00' },
    { label: 'Ob. Mórbida', imc: 40, color: '#9e5700' },
    { label: 'Doble Ob. Mórbida', imc: 50, color: '#b00000' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col h-auto sm:h-[450px]">
      <h2 className="text-lg font-bold text-slate-700 mb-4 shrink-0">Evolución (kg)</h2>
      
      <div className="h-[250px] sm:flex-1 w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time"
              domain={['dataMin', 'dataMax']} 
              tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' })}
              stroke="#94a3b8"
              fontSize={12}
              minTickGap={20}
            />
            <YAxis domain={[yMin, yMax]} stroke="#94a3b8" fontSize={12} />
            
            {/* Tooltip espía */}
            <Tooltip 
              cursor={{stroke: '#ecfdf5', strokeWidth: 2}} 
              content={<SyncTooltip onUpdate={handleUpdate} />}
            />
            
            {limites.map(limite => {
              const weight = calcularPesoParaIMC(limite.imc, altura);
              if (weight >= yMin && weight <= yMax) {
                return (
                  <ReferenceLine 
                    key={limite.label} 
                    y={weight} 
                    stroke={limite.color} 
                    strokeDasharray="3 3" 
                    label={{ position: 'top', value: limite.label, fill: limite.color, fontSize: 11 }} 
                  />
                );
              }
              return null;
            })}
            
            <Line 
              type="monotone" 
              dataKey="peso" 
              stroke="#cbd5e1" 
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 5 }}
              name="peso"
            />

            <Line 
              type="monotone" 
              dataKey="promedio" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 7 }}
              name="promedio"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Panel Móvil */}
      <div className="sm:hidden mt-4 pt-4 border-t border-slate-100 flex-1 flex justify-center">
        {selectedData ? (
          <PesoInfoCard data={selectedData} isTooltip={false} />
        ) : (
          <p className="text-center text-slate-400 text-sm font-medium py-4">Toca un día para ver detalles</p>
        )}
      </div>
    </div>
  );
};