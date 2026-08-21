import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#64748b'];

interface Props {
  data: any;
  pieDays: number;
  setPieDays: (days: number) => void;
}

export const EstadisticasPieCharts: React.FC<Props> = ({ data, pieDays, setPieDays }) => {
  const [customDays, setCustomDays] = useState<string>(pieDays.toString());

  const handleCustomDaysSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customDays);
    if (!isNaN(parsed) && parsed > 0) setPieDays(parsed);
  };

  return (
    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
      {/* CORRECCIÓN: flex-nowrap y shrink para mantener una sola línea */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        
        {/* El título puede encogerse un poco si es necesario */}
        <h2 className="text-lg sm:text-xl font-black text-indigo-900 flex items-center gap-2 flex-shrink min-w-0">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 shrink-0"/> 
          <span className="truncate">Distribución del Entrenamiento</span>
        </h2>
        
        <form onSubmit={handleCustomDaysSubmit} className="flex flex-nowrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
          {[7, 14, 28, 35].map(d => (
            <button type="button" key={d} onClick={() => { setPieDays(d); setCustomDays(d.toString()); }} className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${pieDays === d ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
              {d}d
            </button>
          ))}
          <div className="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block"></div>
          <input type="number" value={customDays} onChange={(e) => setCustomDays(e.target.value)} className="w-12 bg-white border border-slate-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold outline-none focus:border-indigo-500" placeholder="Días" />
          <button type="submit" className="text-xs font-bold text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-lg">Ir</button>
        </form>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-72 flex flex-col items-center w-full">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Por Tipo</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.tipos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                {data.tipos.map((_: any, index: number) => <Cell key={`cell-tipo-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [`${value} series`, 'Tipo']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="h-72 flex flex-col items-center w-full">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Por Músculo</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.musculos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                {data.musculos.map((_: any, index: number) => <Cell key={`cell-musc-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [`${value} series`, 'Músculo']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};