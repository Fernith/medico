import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Ciclo } from '../../utils/reglaCalculations';

interface ReglaTablaProps {
  ciclos: Ciclo[];
  onEdit: (ciclo: Ciclo) => void;
  onDelete: (id: string) => void;
}

const CARAS = {
  1: { emoji: '😫', color: 'bg-rose-400 border-rose-600' },
  2: { emoji: '😔', color: 'bg-orange-400 border-orange-600' },
  3: { emoji: '😐', color: 'bg-yellow-300 border-yellow-400' },
  4: { emoji: '😊', color: 'bg-lime-400 border-lime-600' },
  5: { emoji: '🤩', color: 'bg-emerald-600 border-emerald-700' },
};

// Formatea la fecha a "12 Sept 26"
const formatFechaMola = (isoDate: string) => {
  const d = new Date(isoDate);
  const dia = d.getDate();
  const mes = d.toLocaleDateString('es-ES', { month: 'short' });
  const año = d.getFullYear().toString().slice(-2);
  return `${dia} ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`;
};

export const ReglaTabla: React.FC<ReglaTablaProps> = ({ ciclos, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-pink-100 flex flex-col max-h-[382px]">
      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar rounded-xl">
        <table className="w-full text-sm text-left relative">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-20">
            <tr>
              <th className="px-4 py-3 font-semibold text-center w-16">Ánimo</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Periodo</th>
              <th className="px-4 py-3 font-semibold w-full">Sensaciones</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ciclos.map((ciclo) => {
              const cara = ciclo.estado_animo ? CARAS[ciclo.estado_animo as keyof typeof CARAS] : null;
              
              return (
                <tr key={ciclo.id} className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    {cara ? (
                      <div className={`w-10 h-10 mx-auto flex items-center justify-center text-2xl rounded-full border shadow-sm ${cara.color}`}>
                        {cara.emoji}
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                    {formatFechaMola(ciclo.fecha_inicio)} 
                    <span className="mx-2 text-pink-300">➔</span> 
                    {ciclo.fecha_fin ? (
                      formatFechaMola(ciclo.fecha_fin)
                    ) : (
                      <span className="text-pink-500 font-black text-xs bg-pink-100 px-2 py-1 rounded-md uppercase tracking-wider">
                        En curso
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-gray-600 w-full">
                    {ciclo.sensacion ? (
                      <p className="text-xs font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed w-full" title={ciclo.sensacion}>
                        {ciclo.sensacion}
                      </p>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 flex justify-end gap-3 items-center h-full pt-6">
                    <button onClick={() => onEdit(ciclo)} className="text-slate-400 hover:text-pink-600 transition-colors" title="Editar"><Edit2 className="w-5 h-5 inline" /></button>
                    <button onClick={() => onDelete(ciclo.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Borrar"><Trash2 className="w-5 h-5 inline" /></button>
                  </td>
                </tr>
              );
            })}
            {ciclos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                  No hay registros de ciclos menstruales aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};