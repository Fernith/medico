import React, { useState } from 'react';
import { type MedicionDB } from '../../utils/medicionCalculations';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { MedicionForm } from './MedicionForm';

interface MedidasTablaProps {
  mediciones: MedicionDB[];
}

export const MedidasTabla: React.FC<MedidasTablaProps> = ({ mediciones }) => {
  const [editItem, setEditItem] = useState<MedicionDB | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/mediciones/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicion' }));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-rose-50/50 border-b border-rose-100">
          <h2 className="text-lg font-bold text-rose-800">Historial de Medidas</h2>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Cintura</th>
                <th className="px-4 py-3 font-semibold">Cadera</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mediciones.map(m => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{new Date(m.fecha).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-bold text-rose-600">{m.cm_cintura ? `${m.cm_cintura} cm` : '-'}</td>
                  <td className="px-4 py-3 font-bold text-rose-600">{m.cm_cadera ? `${m.cm_cadera} cm` : '-'}</td>
                  
                  <td className="px-4 py-3 text-right space-x-3">
                    {/* Botón Editar (Lápiz) */}
                    <button 
                      onClick={() => setEditItem(m as any)} 
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Editar medida"
                    >
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {/* Botón Borrar (Papelera) */}
                    <button 
                      onClick={() => setDeleteId(m.id)} 
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Borrar medida"
                    >
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {mediciones.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No hay medidas registradas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Medida">
        {editItem && <MedicionForm initialData={editItem as any} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onCancel={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Borrar Medida" 
        description="¿Seguro que quieres borrar esta medida?"
        variant="danger" confirmText="Borrar"
      />
    </>
  );
};