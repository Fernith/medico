import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Pill, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { MedicamentoForm, type Medicamento } from './MedicamentoForm';

export const MedicamentosTabla: React.FC<{ medicamentos: Medicamento[] }> = ({ medicamentos }) => {
  const [editingItem, setEditingItem] = useState<Medicamento | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // PAGINACIÓN: Inicializada a 5
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/medicamentos/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicamento' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicacion_activa' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const modalTheme = { titleColor: 'text-teal-900', headerBorder: 'border-teal-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-teal-600', modalBorder: 'border-teal-400' };

  // Filtrado y Paginación
  const medicamentosFiltrados = useMemo(() => {
    return medicamentos.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [medicamentos, searchTerm]);

  const totalPages = Math.ceil(medicamentosFiltrados.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = medicamentosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-lg font-bold text-teal-800 shrink-0 flex items-center gap-2"><Pill className="w-5 h-5 text-teal-500" /> Catálogo de Medicamentos</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* BUSCADOR */}
            <div className="relative w-full sm:w-64 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" placeholder="Buscar medicamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none px-2"
              />
            </div>

            <button onClick={() => { setEditingItem(null); setIsAddOpen(true); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-teal-500/30 w-full sm:w-auto" style={{ height: '42px' }}>
              <Plus className="w-4 h-4" strokeWidth={3} /> <span>Añadir</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold">Medicamento y Notas</th>
                <th className="px-4 py-3 font-semibold">Formato y Dosis</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(med => (
                <tr key={med.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <div className="font-bold text-slate-800">{med.nombre}</div>
                    {/* CORRECCIÓN: Inclusión de las notas de forma visual completa */}
                    {med.notas && (
                      <div className="text-xs text-slate-500 mt-1 whitespace-normal leading-relaxed max-w-sm">
                        {med.notas}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium align-top pt-4">{med.formato} - {med.dosis} {med.unidad_dosis}</td>
                  <td className="px-4 py-3 align-top pt-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold uppercase tracking-wider">{med.categoria_nombre || 'Sin categoría'}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap align-top pt-4">
                    <button onClick={() => { setEditingItem(med); setIsAddOpen(true); }} className="text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="w-5 h-5 inline" /></button>
                    <button onClick={() => setDeleteId(med.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500"><Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />No hay medicamentos que coincidan.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN RESPONSIVE */}
        {medicamentosFiltrados.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
            <div className="flex items-center gap-2 order-1 sm:order-none">
              <span className="font-semibold text-slate-600">Filas:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-teal-500 font-medium shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <span className="font-medium text-slate-600 order-3 sm:order-none w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, medicamentosFiltrados.length)} de {medicamentosFiltrados.length} resultados
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingItem ? "Editar Medicamento" : "Añadir Medicamento"} colorTheme={modalTheme}>
        <MedicamentoForm initialData={editingItem} onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Medicamento" 
        description="⚠️ ¡ATENCIÓN! Si borras este medicamento, desaparecerá de todas las planificaciones activas e historial. Esta acción no se puede deshacer."
        variant="danger" confirmText="Borrar definitivamente"
      />
    </>
  );
};