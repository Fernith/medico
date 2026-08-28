import React from 'react';
import { ActivitySquare, Map, Target } from 'lucide-react';

interface PasosIndicadoresProps {
  totalPasos: number;
  totalKm: number;
  avgPasos: number;
  avgKm: number;
  viewMode: 'S' | 'M' | 'A';
}

export const PasosIndicadores: React.FC<PasosIndicadoresProps> = ({ totalPasos, totalKm, avgPasos, avgKm, viewMode }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100 flex flex-col justify-between shadow-sm hover:shadow transition-shadow">
        <div className="text-orange-500 mb-2"><ActivitySquare className="w-6 h-6" /></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Pasos Totales</p>
        <p className="text-2xl sm:text-3xl font-black text-slate-800">{totalPasos.toLocaleString('es-ES')}</p>
      </div>
      
      <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100 flex flex-col justify-between shadow-sm hover:shadow transition-shadow">
        <div className="text-orange-500 mb-2"><Map className="w-6 h-6" /></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Distancia Total</p>
        <p className="text-2xl sm:text-3xl font-black text-slate-800">{totalKm.toFixed(2)} <span className="text-lg text-slate-500 font-bold">km</span></p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-orange-200 transition-colors">
        <div className="text-slate-400 mb-2"><Target className="w-6 h-6" /></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Media de Pasos</p>
        <p className="text-2xl sm:text-3xl font-black text-slate-800">{avgPasos.toLocaleString('es-ES')} <span className="text-sm font-bold text-slate-400">/{viewMode === 'A' ? 'mes' : 'día'}</span></p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-orange-200 transition-colors">
        <div className="text-slate-400 mb-2"><Map className="w-6 h-6" /></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Media de Distancia</p>
        <p className="text-2xl sm:text-3xl font-black text-slate-800">{avgKm.toFixed(2)} <span className="text-lg text-slate-500 font-bold">km</span></p>
      </div>
    </div>
  );
};