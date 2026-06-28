import React from 'react';

interface Peso {
  id: string;
  fecha: string;
  peso_kg: string;
  comido_recientemente: boolean;
  momento_dia: 'día' | 'noche';
}

interface TablaPesosProps {
  datos: Peso[];
}

export const TablaPesos: React.FC<TablaPesosProps> = ({ datos }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
            <th className="p-4">Fecha</th>
            <th className="p-4">Peso</th>
            <th className="p-4">Momento</th>
            <th className="p-4">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
          {datos.length === 0 ? (
            <tr><td colSpan={4} className="p-4 text-center text-slate-400">Sin datos registrados</td></tr>
          ) : (
            datos.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{new Date(item.fecha).toLocaleDateString()}</td>
                <td className="p-4 font-semibold text-blue-600">{parseFloat(item.peso_kg).toFixed(2)} kg</td>
                <td className="p-4 capitalize">{item.momento_dia}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.comido_recientemente ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    {item.comido_recientemente ? 'Con ingesta' : 'En ayunas'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};