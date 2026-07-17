import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { EquipamientoForm } from './EquipamientoForm';
import { Plus, Trash2 } from 'lucide-react';

interface Equipamiento {
  id: string;
  nombre: string;
}

export const EquipamientoTabla: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipamiento[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchEquipos = async () => {
    try {
      const res = await fetch('/api/equipamiento');
      if (res.ok) setEquipos(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchEquipos();
    const handleRegistro = (e: any) => { if (e.detail === 'equipamiento') fetchEquipos(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/equipamiento/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'equipamiento' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'ejercicio' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-indigo-800">Equipamiento</h2>
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
              {equipos.map(eq => (
                <tr key={eq.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-800">{eq.nombre}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setDeleteId(eq.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir Equipamiento" colorTheme={modalTheme}>
        <EquipamientoForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Equipamiento" 
        description="⚠️ ¡ATENCIÓN! Si borras este equipamiento, desaparecerá automáticamente de todos los ejercicios que lo estuvieran usando. Esta acción no se puede deshacer."
        variant="danger" confirmText="Borrar definitivamente"
      />
    </>
  );
};