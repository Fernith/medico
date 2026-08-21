import React, { useState } from 'react';
import { type PesoDB } from '../../utils/pesoCalculations';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PesoForm } from './PesoForm';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PesosTablaProps {
  pesos: PesoDB[];
}

export const PesosTabla: React.FC<PesosTablaProps> = ({ pesos }) => {
  const [editItem, setEditItem] = useState<PesoDB | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/pesos/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'peso' }));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(pesos.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = pesos.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [itemsPerPage, pesos.length]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100">
          <h2 className="text-lg font-bold text-emerald-800">Historial de Pesos</h2>
        </div>
        
        {/* CORRECCIÓN: Eliminado min-h-[250px] */}
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Peso</th>
                <th className="px-4 py-3 font-semibold text-center">Ayunas</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {new Date(p.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{p.peso} kg</td>
                  
                  <td className="px-4 py-3 text-center text-lg" title={p.en_ayunas ? 'En ayunas' : 'No en ayunas'}>
                    {p.en_ayunas ? '☀️' : <span className="text-slate-300">-</span>}
                  </td>
                  
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button 
                      onClick={() => setEditItem(p)} 
                      className="text-slate-400 hover:text-emerald-500 transition-colors"
                      title="Editar registro"
                    >
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setDeleteId(p.id)} 
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Borrar registro"
                    >
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {pesos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No hay pesos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pesos.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
            
            <div className="flex items-center gap-2 order-1 sm:order-none">
              <span className="font-semibold text-slate-600">Filas:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-emerald-500 font-medium shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <span className="font-medium text-slate-600 order-3 sm:order-none w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, pesos.length)} de {pesos.length} resultados
            </span>

            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm order-2 sm:order-none ml-auto sm:ml-0">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600"/>
              </button>
              <span className="font-bold text-slate-700 min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600"/>
              </button>
            </div>

          </div>
        )}
      </div>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Peso">
        {editItem && <PesoForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onCancel={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Borrar Peso" 
        description="¿Seguro que quieres borrar este registro?"
        variant="danger" confirmText="Borrar"
      />
    </>
  );
};