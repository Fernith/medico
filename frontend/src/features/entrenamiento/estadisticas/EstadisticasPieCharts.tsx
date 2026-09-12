import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#64748b'];

interface Props {
  data: any;
  rangoPie: 7 | 14 | 28 | 35 | 'custom';
  setRangoPie: (rango: 7 | 14 | 28 | 35 | 'custom') => void;
  customPieDias: number | '';
  setCustomPieDias: (dias: number | '') => void;
}

export const EstadisticasPieCharts: React.FC<Props> = ({ 
  data, rangoPie, setRangoPie, customPieDias, setCustomPieDias 
}) => {

  // Creamos una copia inmutable de los datos inyectando el color (Evita usar <Cell /> y no rompe React)
  const tiposData = data.tipos?.map((entry: any, index: number) => ({
    ...entry,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const musculosData = data.musculos?.map((entry: any, index: number) => ({
    ...entry,
    fill: COLORS[(index + 3) % COLORS.length]
  })) || [];

  return (
    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        
        <h2 className="text-lg sm:text-xl font-black text-indigo-900 flex items-center gap-2 flex-shrink min-w-0">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 shrink-0"/> 
          <span className="truncate">Distribución</span>
        </h2>
        
        {/* LA BOTONERA EXACTA DE SUEÑO */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg w-max shrink-0">
          {([7, 14, 28, 35] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRangoPie(d)}
              className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${rangoPie === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {d}d
            </button>
          ))}
          <div className={`flex items-center ml-1 px-2 py-1.5 rounded-md transition-all ${rangoPie === 'custom' ? 'bg-white shadow-sm' : ''}`}>
            <input
              type="number"
              value={customPieDias}
              onChange={(e) => {
                setRangoPie('custom');
                setCustomPieDias(e.target.value === '' ? '' : Number(e.target.value));
              }}
              placeholder="X"
              className="w-10 text-center bg-transparent outline-none font-bold text-indigo-600 placeholder:text-slate-400 text-sm"
              min="1"
            />
            <span className={`text-sm font-bold ml-1 ${rangoPie === 'custom' ? 'text-indigo-600' : 'text-slate-500'}`}>d</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-72 flex flex-col items-center w-full">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Por Tipo</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Usamos tiposData directamente sin children */}
              <Pie data={tiposData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} />
              
              {/* Tooltip con el nombre dinámico */}
              <Tooltip formatter={(value, name) => [`${value} series`, name]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="h-72 flex flex-col items-center w-full">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Por Músculo</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Usamos musculosData directamente sin children */}
              <Pie data={musculosData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} />
              
              {/* Tooltip con el nombre dinámico */}
              <Tooltip formatter={(value, name) => [`${value} series`, name]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};