import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

interface Props {
  data: any[];
}

// 1. Tarjeta Visual Compartida (Ahora perfectamente centrada y pulida)
const EntrenoInfoCard = ({ data, isTooltip = false }: { data: any, isTooltip?: boolean }) => {
  return (
    <div className={isTooltip 
      ? "bg-white p-4 rounded-3xl shadow-xl border border-indigo-50 text-center min-w-[160px]" 
      : "w-full animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center text-center"
    }>
      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
        Mes: {data.name}
      </p>
      
      {/* Añadido w-full y max-w para que quede como un botón central elegante */}
      <div className="bg-indigo-50/80 rounded-2xl p-3 border border-indigo-100/50 w-full max-w-[200px]">
        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Entrenamientos</p>
        <p className="text-3xl font-black text-indigo-600 leading-none">{data.Entrenos}</p>
      </div>
    </div>
  );
};

// 2. El "Caballo de Troya" (SyncTooltip)
const SyncTooltip = ({ active, payload, onUpdate }: any) => {
  useEffect(() => {
    if (active && payload && payload.length) {
      onUpdate(payload[0].payload);
    }
  }, [active, payload, onUpdate]);

  if (active && payload && payload.length) {
    return (
      <div className="hidden sm:block">
        <EntrenoInfoCard data={payload[0].payload} isTooltip={true} />
      </div>
    );
  }
  return null;
};

export const EstadisticasMeses: React.FC<Props> = ({ data }) => {
  const [selectedData, setSelectedData] = useState<any | null>(null);

  // Seleccionar automáticamente el último mes al cargar
  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedData(data[data.length - 1]);
    }
  }, [data]);

  const handleUpdate = useCallback((newData: any) => {
    setSelectedData((prev: any) => {
      if (!prev || prev.name !== newData.name) return newData;
      return prev;
    });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex flex-col h-auto sm:h-[420px]">
      <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2 mb-6 shrink-0">
        <Activity className="w-6 h-6 text-indigo-500"/> Entrenamientos por Mes
      </h2>
      
      {/* Gráfica principal (Se encoge ligeramente en móvil para dar espacio al panel) */}
      <div className="h-[200px] sm:flex-1 w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            
            {/* Ocultamos el Tooltip nativo e inyectamos el nuestro */}
            <Tooltip cursor={{fill: '#f8fafc'}} content={<SyncTooltip onUpdate={handleUpdate} />} />
            
            <Bar dataKey="Entrenos" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Panel inferior (Solo móvil, alineación garantizada) */}
      <div className="sm:hidden mt-4 pt-4 border-t border-slate-100 flex-1 flex justify-center">
        {selectedData ? (
          <EntrenoInfoCard data={selectedData} isTooltip={false} />
        ) : (
          <p className="text-center text-slate-400 text-sm font-medium py-4">Toca un mes para ver detalles</p>
        )}
      </div>
    </div>
  );
};