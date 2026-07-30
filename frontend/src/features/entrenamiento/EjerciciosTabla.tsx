import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { EjercicioForm, type Ejercicio } from './EjercicioForm';
import { Select } from '../../components/ui/Select';
import { Plus, Edit2, Trash2, Image as ImageIcon, ZoomIn, X, RefreshCw, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface EjerciciosTablaProps {
  ejercicios: Ejercicio[];
}

const ITEMS_PER_PAGE = 15;

export const EjerciciosTabla: React.FC<EjerciciosTablaProps> = ({ ejercicios }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Ejercicio | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const [reactivateRealizaciones, setReactivateRealizaciones] = useState(true); // Checkbox activo por defecto
  
  const [viewImage, setViewImage] = useState<Ejercicio | null>(null);
  
  const [filtroEstado, setFiltroEstado] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/ejercicios/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'ejercicio' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'realizacion' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const confirmReactivate = async () => {
    if (!reactivateId) return;
    try {
      await fetch(`/api/ejercicios/${reactivateId}/reactivar`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactivar_realizaciones: reactivateRealizaciones })
      });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'ejercicio' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'realizacion' }));
    } catch (e) { console.error(e); } finally { setReactivateId(null); setReactivateRealizaciones(true); }
  };

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };
  const selectTheme = { borderNormal: 'border-slate-200', borderActive: 'border-indigo-400 ring-4 ring-indigo-50', textSelected: 'text-indigo-900', iconColor: 'text-indigo-500', optionSelectedBg: 'bg-indigo-50', optionSelectedText: 'text-indigo-700', optionHoverBg: 'hover:bg-indigo-50/50', optionHoverText: 'hover:text-indigo-900', checkIcon: 'text-indigo-500' };

  // Filtrado y Paginación combinados
  const ejerciciosFiltrados = useMemo(() => {
    const list = ejercicios.filter(e => {
      const cumpleEstado = filtroEstado === 'todos' || (filtroEstado === 'activos' && e.activo !== false) || (filtroEstado === 'inactivos' && e.activo === false);
      const cumpleBusqueda = e.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return cumpleEstado && cumpleBusqueda;
    });
    return list;
  }, [ejercicios, filtroEstado, searchTerm]);

  const totalPages = Math.ceil(ejerciciosFiltrados.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = ejerciciosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reiniciar página si cambian los filtros
  React.useEffect(() => { setCurrentPage(1); }, [filtroEstado, searchTerm]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-lg font-bold text-indigo-800 shrink-0">Diccionario de Ejercicios</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* BUSCADOR */}
            <div className="relative w-full sm:w-64 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" placeholder="Buscar ejercicio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none px-2"
              />
            </div>
            
            {/* SELECTOR */}
            <div className="w-full sm:w-48">
              <Select 
                value={filtroEstado} onChange={(val) => setFiltroEstado(val as any)}
                options={[ { value: 'activos', label: 'Solo Activos' }, { value: 'inactivos', label: 'Solo Inactivos' }, { value: 'todos', label: 'Mostrar Todos' } ]}
                icon={<Filter className="w-4 h-4 text-slate-500" />} colorTheme={selectTheme}
              />
            </div>

            <button onClick={() => setIsAddOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-500/30 w-full sm:w-auto" style={{ height: '42px' }}>
              <Plus className="w-4 h-4" strokeWidth={3} /> <span>Añadir</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="w-8 px-4"></th>
                <th className="w-24"></th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Grupos Musculares</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(e => {
                const isActivo = e.activo !== false;
                const rowClass = `border-b border-slate-50 transition-colors ${isActivo ? 'hover:bg-slate-50/50' : 'bg-slate-50/50 hover:bg-slate-100/50 opacity-80'}`;
                return (
                  <tr key={e.id} className={rowClass}>
                    <td className="px-4 py-3 text-center"><div className={`w-3 h-3 rounded-full shadow-inner ${isActivo ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} title={isActivo ? 'Activo' : 'Inactivo'}></div></td>
                    <td className="px-4 py-3">
                      {e.imagen ? (
                        <button onClick={() => setViewImage(e)} className={`relative group block rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!isActivo && 'grayscale'}`}>
                          <img src={e.imagen} className="w-12 h-12 object-cover border border-slate-200 shadow-sm group-hover:opacity-70 transition-opacity"/>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-900/20"><ZoomIn className="w-5 h-5 text-white drop-shadow-md" /></div>
                        </button>
                      ) : (<div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><ImageIcon className="w-6 h-6" /></div>)}
                    </td>
                    <td className={`px-4 py-3 font-bold whitespace-nowrap ${isActivo ? 'text-slate-800' : 'text-slate-500'}`}>
                      {e.nombre} {!isActivo && <span className="ml-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest">(Inactivo)</span>}
                      {e.descripcion && <p className="text-xs font-medium text-slate-400 mt-1 line-clamp-1 max-w-[200px]">{e.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {e.tipo_entrenamiento_nombre ? <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${isActivo ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>{e.tipo_entrenamiento_nombre}</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className={`px-4 py-3 font-medium ${isActivo ? 'text-indigo-600' : 'text-slate-400'}`}>{e.grupos_nombres?.join(', ') || 'Ninguno'}</td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => setEditItem(e)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Editar"><Edit2 className="w-5 h-5 inline" /></button>
                      {isActivo ? (
                        <button onClick={() => setDeleteId(e.id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Archivar"><Trash2 className="w-5 h-5 inline" /></button>
                      ) : (
                        <button onClick={() => setReactivateId(e.id)} className="text-slate-400 hover:text-emerald-500 transition-colors" title="Restaurar"><RefreshCw className="w-5 h-5 inline" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500"><ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />No hay resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
            <span className="font-medium">Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, ejerciciosFiltrados.length)} de {ejerciciosFiltrados.length}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 font-medium disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4"/> Anterior</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 font-medium disabled:opacity-50 disabled:hover:text-slate-500 transition-colors">Siguiente <ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {viewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewImage(null)}>
          <div className="relative w-full max-w-5xl flex flex-col gap-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center text-white">
              <h3 className="text-xl font-bold drop-shadow-md">{viewImage.nombre}</h3>
              <button onClick={() => setViewImage(null)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-full transition-colors"><X className="w-6 h-6"/></button>
            </div>
            <img src={viewImage.imagen} className="w-full h-auto max-h-[70vh] object-contain rounded-2xl shadow-2xl bg-black/50 border border-white/10" />
            {viewImage.descripcion && <div className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white"><p className="text-sm">{viewImage.descripcion}</p></div>}
          </div>
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir al Diccionario" size="lg" colorTheme={modalTheme}>
        <EjercicioForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Ejercicio" size="lg" colorTheme={modalTheme}>
        {editItem && <EjercicioForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Archivar Ejercicio" 
        description="¿Seguro que quieres archivar este ejercicio? Al hacerlo, también se inactivarán todas las configuraciones (realizaciones) planificadas que dependan de él. Las estadísticas y el historial se mantendrán intactos."
        variant="danger" confirmText="Inactivar"
      />

      <ConfirmModal 
        isOpen={!!reactivateId} onCancel={() => setReactivateId(null)} onConfirm={confirmReactivate}
        title="Restaurar Ejercicio" 
        description="¿Quieres volver a activar este ejercicio? Volverá a estar disponible para añadir a nuevas rutinas."
        confirmText="Restaurar" variant="success"
      >
        <label className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-colors mt-2">
          <input 
            type="checkbox" className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500" 
            checked={reactivateRealizaciones} onChange={(e) => setReactivateRealizaciones(e.target.checked)}
          />
          <span className="text-sm font-medium text-emerald-900 leading-tight">Reactivar automáticamente todas las configuraciones (realizaciones) que dependían de este ejercicio.</span>
        </label>
      </ConfirmModal>
    </>
  );
};