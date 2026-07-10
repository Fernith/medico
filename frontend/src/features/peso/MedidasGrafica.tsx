import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type MedicionDB, calcularICC, calcularICE } from '../../utils/medicionCalculations';

interface MedidasGraficaProps {
  data: MedicionDB[];
  altura: number;
  sexo: 'Masculino' | 'Femenino';
}

export const MedidasGrafica: React.FC<MedidasGraficaProps> = ({ data, altura, sexo }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return [...data].reverse().map(d => {
      const punto: any = { timestamp: new Date(d.fecha).getTime() };
      if (d.cm_cintura) {
        punto.ice = calcularICE(d.cm_cintura, altura);
        if (d.cm_cadera) {
          punto.icc = calcularICC(d.cm_cintura, d.cm_cadera);
        }
      }
      return punto;
    }).filter(p => p.ice !== undefined); // Solo dibujamos días donde al menos haya ICE
  }, [data, altura]);

  const limiteICC = sexo === 'Masculino' ? 0.90 : 0.85;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 h-[400px]">
      <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span className="text-rose-500">📏</span> Evolución de Índices (ICE / ICC)
      </h2>
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
          {/* Fijo la escala Y para los ratios de 0.3 a 1.2 */}
          <YAxis domain={[0.3, 1.2]} stroke="#94a3b8" fontSize={12} />
          
          <Tooltip 
            labelFormatter={(unix: any) => new Date(unix).toLocaleDateString()}
            formatter={(value: any, name: any) => [Number(value).toFixed(2), name.toUpperCase()]}
          />
          
          {/* Líneas de peligro */}
          <ReferenceLine y={0.50} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Riesgo ICE', fill: '#ef4444', fontSize: 10 }} />
          <ReferenceLine y={limiteICC} stroke="#e11d48" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Riesgo ICC', fill: '#e11d48', fontSize: 10 }} />
          
          <Line type="monotone" dataKey="ice" stroke="#0ea5e9" strokeWidth={3} name="ICE" dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="icc" stroke="#8b5cf6" strokeWidth={3} name="ICC" dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};