import React from 'react';
import type { Ciclo } from '../../utils/reglaCalculations';

interface ReglaTablaProps {
  ciclos: Ciclo[];
  onEdit: (ciclo: Ciclo) => void;
  onDelete: (id: string) => void;
}

export const ReglaTabla: React.FC<ReglaTablaProps> = ({ ciclos, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-pink-100 flex flex-col max-h-[382px]">
      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar rounded-xl">
        <table className="w-full text-sm text-left relative">
          <thead className="text-xs text-purple-800 uppercase bg-pink-50 sticky top-0 z-20 shadow-sm">
            <tr>
              <th scope="col" className="px-6 py-3">Inicio del periodo</th>
              <th scope="col" className="px-6 py-3">Fin del periodo</th>
              <th scope="col" className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ciclos.map((ciclo) => (
              <tr key={ciclo.id} className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {new Date(ciclo.fecha_inicio).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {ciclo.fecha_fin ? new Date(ciclo.fecha_fin).toLocaleDateString() : (
                    <span className="text-pink-500 font-semibold text-xs bg-pink-100 px-2 py-1 rounded-full">
                      En curso
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex justify-end gap-3">
                  <button onClick={() => onEdit(ciclo)} className="text-purple-500 hover:text-purple-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button onClick={() => onDelete(ciclo.id)} className="text-red-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {ciclos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
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