import React from 'react';
import { Calendar } from 'lucide-react';

interface Props {
  stats: { maxDia: string; maxVal: number; minDia: string; minVal: number; };
}

export const EstadisticasFrecuencia: React.FC<Props> = ({ stats }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex flex-col h-full">
      <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2 mb-6"><Calendar className="w-6 h-6 text-indigo-500"/> Frecuencia (Últ. 35 d)</h2>
      <div className="flex-1 flex flex-col gap-4 justify-center">
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Día más activo</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{stats.maxDia}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black shadow-md">{stats.maxVal}</div>
        </div>
        
        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Día menos activo</p>
            <p className="text-2xl font-black text-rose-900 mt-1">{stats.minDia}</p>
          </div>
          <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-black shadow-md">{stats.minVal}</div>
        </div>
      </div>
    </div>
  );
};