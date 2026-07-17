import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { GrupoMuscularForm, type GrupoMuscular } from './GrupoMuscularForm';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const GruposTabla: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<GrupoMuscular | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchGrupos = async () => {
    try {
      const res = await fetch('/api/grupos-musculares');
      if (res.ok) setGrupos(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchGrupos();
    const handleRegistro = (e: any) => { if (e.detail === 'grupo_muscular') fetchGrupos(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/grupos-musculares/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'grupo_muscular' }));
      // Disparamos también la actualización de ejercicios por si acaso ha afectado a alguno
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'ejercicio' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-indigo-800">Grupos Musculares</h2>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" strokeWidth={3} /> Añadir
          </button>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-96 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map(g => (
                <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-800">{g.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold uppercase">{g.categoria}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setEditItem(g)} className="text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 className="w-4 h-4 inline" /></button>
                    <button onClick={() => setDeleteId(g.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir Grupo Muscular" colorTheme={modalTheme}>
        <GrupoMuscularForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Grupo Muscular" colorTheme={modalTheme}>
        {editItem && <GrupoMuscularForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Grupo Muscular" 
        description="⚠️ ¡ATENCIÓN! Si borras este grupo muscular, se desvinculará automáticamente de todos los ejercicios que lo tengan asignado. Esta acción no se puede deshacer."
        variant="danger" confirmText="Borrar definitivamente"
      />
    </>
  );
};