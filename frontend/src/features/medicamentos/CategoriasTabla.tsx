import React, { useState, useEffect } from 'react';
import { Trash2, Tag, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CategoriaForm } from './CategoriaForm';

export interface CategoriaMedicamento { id: string; nombre: string; color: string; }

export const CategoriasTabla: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaMedicamento[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categorias-medicamentos');
      if (res.ok) setCategorias(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCategorias();
    const handleRegistro = (e: any) => { if (e.detail === 'categoria_medicamento') fetchCategorias(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/categorias-medicamentos/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'categoria_medicamento' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicamento' }));
      fetchCategorias();
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const modalTheme = { titleColor: 'text-teal-900', headerBorder: 'border-teal-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-teal-600', modalBorder: 'border-teal-400' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-teal-800 flex items-center gap-2"><Tag className="w-5 h-5 text-teal-500" /> Categorías</h2>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition-all shadow-sm">
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
              {categorias.map(cat => (
                <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: cat.color }}></div>
                      <span className="font-bold text-slate-800">{cat.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setDeleteId(cat.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">No hay categorías.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir Categoría" colorTheme={modalTheme}>
        <CategoriaForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Categoría" 
        description="⚠️ ¡ATENCIÓN! Si borras esta categoría, los medicamentos que la utilicen se quedarán sin categoría (vacío). Esta acción no se puede deshacer."
        variant="danger" confirmText="Borrar definitivamente"
      />
    </>
  );
};