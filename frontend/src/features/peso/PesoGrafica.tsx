import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calcularPesoParaIMC, type PesoDB } from '../../utils/pesoCalculations';

interface PesoGraficaProps {
  data: PesoDB[];
  altura: number;
}

export const PesoGrafica: React.FC<PesoGraficaProps> = ({ data, altura }) => {
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

  const limites = [
    { label: 'Bajo peso', imc: 18.5, color: '#3b82f6' },
    { label: 'Sobrepeso', imc: 25, color: '#056200' },
    { label: 'Ob. Moderada', imc: 30, color: '#b0b600' },
    { label: 'Ob. Grave', imc: 35, color: '#e48d00' },
    { label: 'Ob. Mórbida', imc: 40, color: '#9e5700' },
    { label: 'Doble Ob. Mórbida', imc: 50, color: '#b00000' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 h-[450px]">
      <h2 className="text-lg font-bold text-slate-700 mb-4">Evolución (kg)</h2>
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
          
          <Tooltip 
            labelFormatter={(unix: any) => new Date(unix).toLocaleDateString()}
            formatter={(value: any, name: any) => {
              const valorNumerico = Number(value);
              return [
                `${valorNumerico.toFixed(1)} kg`, 
                name === 'promedio' ? 'Promedio (4 sem)' : 'Peso Real'
              ];
            }}
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
          
          {/* LÍNEA 1: Peso Real (Sin puntos, solo visible al hover) */}
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

          {/* LÍNEA 2: Promedio (Sin puntos, solo visible al hover) */}
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
  );
};