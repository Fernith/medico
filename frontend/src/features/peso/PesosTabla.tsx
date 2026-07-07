import React from 'react';
import type { PesoDB } from '../../utils/pesoCalculations';

interface PesosTablaProps {
  pesos: PesoDB[];
  onEdit: (peso: PesoDB) => void;
  onDelete: (id: string | number) => void;
}

export const PesosTabla: React.FC<PesosTablaProps> = ({ pesos, onEdit, onDelete }) => {
  if (pesos.length === 0) return <p className="text-gray-500 text-sm">No hay registros de peso.</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-50/50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-emerald-800">Fecha</th>
              <th className="px-4 py-3 font-semibold text-emerald-800">Peso</th>
              <th className="px-4 py-3 font-semibold text-emerald-800 text-center">Ayunas</th>
              <th className="px-4 py-3 font-semibold text-emerald-800 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {pesos.slice(0, 10).map((registro) => {
              const date = new Date(registro.fecha);
              return (
                <tr key={registro.id} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-4 py-3 text-slate-600">{date.toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{registro.peso} kg</td>
                  <td className="px-4 py-3 text-center">
                    {registro.en_ayunas ? '☀️' : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                      <button onClick={() => onEdit(registro)} className="text-slate-400 hover:text-emerald-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => onDelete(registro.id)} className="text-slate-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};