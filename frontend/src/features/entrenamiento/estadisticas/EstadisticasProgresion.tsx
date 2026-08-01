import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TrendArrow = ({ current, prev }: { current: number, prev: number }) => {
  const diff = current - prev;
  if (diff === 0) return <Minus className="w-4 h-4 text-slate-400 inline" />;
  if (diff > 0) return <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs"><TrendingUp className="w-4 h-4"/> +{diff.toFixed(1)}</span>;
  return <span className="flex items-center gap-1 text-rose-500 font-bold text-xs"><TrendingDown className="w-4 h-4"/> {diff.toFixed(1)}</span>;
};

interface Props {
  data: any[];
}

export const EstadisticasProgresion: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
      <div className="p-6 bg-indigo-50/50 border-b border-indigo-100">
        <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-indigo-500"/> Progresión por Ejercicio</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Comparativa de tu última sesión frente a la penúltima (Métricas por sesión).</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold">Ejercicio</th>
              <th className="px-6 py-4 font-bold text-center">Peso Máximo (RM)</th>
              <th className="px-6 py-4 font-bold text-center">Volumen Total</th>
              <th className="px-6 py-4 font-bold text-center">Reps Totales</th>
            </tr>
          </thead>
          <tbody>
            {data.map((ej: any, i: number) => {
              if (!ej.last) return null;
              const rowClass = i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';
              
              return (
                <tr key={ej.ejercicio_nombre} className={`${rowClass} border-b border-slate-100 hover:bg-slate-50 transition-colors`}>
                  <td className="px-6 py-4 font-black text-slate-700">{ej.ejercicio_nombre}</td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-indigo-900 text-base">{ej.last.maxPeso} <span className="text-xs text-slate-400 font-medium">{ej.last.unidad}</span></span>
                      {ej.prev && <TrendArrow current={ej.last.maxPeso} prev={ej.prev.maxPeso} />}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-700 text-base">{ej.last.volumenTotal} <span className="text-xs text-slate-400 font-medium">{ej.last.unidad}</span></span>
                      {ej.prev && <TrendArrow current={ej.last.volumenTotal} prev={ej.prev.volumenTotal} />}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-700 text-base">{ej.last.totalReps} <span className="text-xs text-slate-400 font-medium">reps</span></span>
                      {ej.prev && <TrendArrow current={ej.last.totalReps} prev={ej.prev.totalReps} />}
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">No hay suficientes datos en el historial.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};