import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { TipoEntrenamientoForm } from './TipoEntrenamientoForm';
import { Plus, Trash2 } from 'lucide-react';

interface TipoEntrenamiento { id: string; nombre: string; }

export const TipoEntrenamientoTabla: React.FC = () => {
  const [tipos, setTipos] = useState<TipoEntrenamiento[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTipos = async () => {
    try {
      const res = await fetch('/api/tipos-entrenamiento');
      if (res.ok) setTipos(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTipos();
    const handleRegistro = (e: any) => { if (e.detail === 'tipo_entrenamiento') fetchTipos(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/tipos-entrenamiento/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'tipo_entrenamiento' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'ejercicio' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-indigo-800">Tipos de Entren.</h2>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" strokeWidth={3} /> Añadir
          </button>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-96 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-800">{t.nombre}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setDeleteId(t.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir Tipo de Entrenamiento" colorTheme={modalTheme}>
        <TipoEntrenamientoForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Tipo de Entrenamiento" 
        description="⚠️ Si borras este tipo, desaparecerá de todos los ejercicios asociados. Esta acción no se puede deshacer."
        variant="danger" confirmText="Borrar definitivamente"
      />
    </>
  );
};