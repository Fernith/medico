import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { RealizacionForm, type RealizacionEjercicio } from './RealizacionForm';
import { Select } from '../../components/ui/Select';
import { Plus, Edit2, Trash2, Clock, Image as ImageIcon, ZoomIn, X, RefreshCw, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 15;

export const RealizacionTabla: React.FC = () => {
  const [realizaciones, setRealizaciones] = useState<RealizacionEjercicio[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<RealizacionEjercicio | null>(null);
  
  // Estados para modales de confirmación
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const [blockedReactivateItem, setBlockedReactivateItem] = useState<RealizacionEjercicio | null>(null); // <-- NUEVO ESTADO
  
  const [viewImage, setViewImage] = useState<RealizacionEjercicio | null>(null);
  
  const [filtroEstado, setFiltroEstado] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRealizaciones = async () => {
    try {
      const res = await fetch('/api/realizaciones');
      if (res.ok) setRealizaciones(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchRealizaciones();
    const handleRegistro = (e: any) => { if (e.detail === 'realizacion' || e.detail === 'ejercicio') fetchRealizaciones(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/realizaciones/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'realizacion' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'rutina' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  // <-- MODIFICADO: En lugar de un alert, abrimos el nuevo modal de bloqueo
  const attemptReactivate = (r: RealizacionEjercicio) => {
    if (r.ejercicio_activo === false) {
      setBlockedReactivateItem(r);
      return;
    }
    setReactivateId(r.id);
  };

  const confirmReactivate = async () => {
    if (!reactivateId) return;
    try {
      await fetch(`/api/realizaciones/${reactivateId}/reactivar`, { method: 'PATCH' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'realizacion' }));
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'rutina' }));
    } catch (e) { console.error(e); } finally { setReactivateId(null); }
  };

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };
  const selectTheme = { borderNormal: 'border-slate-200', borderActive: 'border-indigo-400 ring-4 ring-indigo-50', textSelected: 'text-indigo-900', iconColor: 'text-indigo-500', optionSelectedBg: 'bg-indigo-50', optionSelectedText: 'text-indigo-700', optionHoverBg: 'hover:bg-indigo-50/50', optionHoverText: 'hover:text-indigo-900', checkIcon: 'text-indigo-500' };

  const realizacionesFiltradas = useMemo(() => {
    const list = realizaciones.filter(r => {
      const cumpleEstado = filtroEstado === 'todos' || (filtroEstado === 'activos' && r.activo !== false) || (filtroEstado === 'inactivos' && r.activo === false);
      const cumpleBusqueda = r.ejercicio_nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return cumpleEstado && cumpleBusqueda;
    });
    return list;
  }, [realizaciones, filtroEstado, searchTerm]);

  const totalPages = Math.ceil(realizacionesFiltradas.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = realizacionesFiltradas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  React.useEffect(() => { setCurrentPage(1); }, [filtroEstado, searchTerm]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-lg font-bold text-indigo-800 shrink-0">Ejercicios Planificados</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* BUSCADOR */}
            <div className="relative w-full sm:w-64 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" placeholder="Buscar configuración..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
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
                <th className="px-4 py-3 font-semibold">Ejercicio</th>
                <th className="px-4 py-3 font-semibold text-center">Series x Reps</th>
                <th className="px-4 py-3 font-semibold text-center">Carga</th>
                <th className="px-4 py-3 font-semibold text-center">Descanso</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(r => {
                const isActivo = r.activo !== false;
                const rowClass = `border-b border-slate-50 transition-colors ${isActivo ? 'hover:bg-slate-50/50' : 'bg-slate-50/50 hover:bg-slate-100/50 opacity-80'}`;
                //const textClassPrimary = isActivo ? 'text-slate-800' : 'text-slate-500';

                return (
                  <tr key={r.id} className={rowClass}>
                    <td className="px-4 py-3 text-center"><div className={`w-3 h-3 rounded-full shadow-inner ${isActivo ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} title={isActivo ? 'Activo' : 'Inactivo'}></div></td>
                    <td className="px-4 py-3">
                      {r.ejercicio_imagen ? (
                        <button onClick={() => setViewImage(r)} className={`relative group block rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!isActivo && 'grayscale'}`}>
                          <img src={r.ejercicio_imagen} className="w-12 h-12 object-cover border border-slate-200 shadow-sm group-hover:opacity-70 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-900/20"><ZoomIn className="w-5 h-5 text-white drop-shadow-md" /></div>
                        </button>
                      ) : (<div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><ImageIcon className="w-6 h-6" /></div>)}
                    </td>
                    <td className={`px-4 py-3 font-bold whitespace-nowrap ${isActivo ? 'text-slate-800' : 'text-slate-500'}`}>
                      {r.ejercicio_nombre} {!isActivo && <span className="ml-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest">(Inactivo)</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-bold">
                      {r.series ? `${r.series} x ` : ''}{r.reps_min === r.reps_max && r.reps_min ? r.reps_min : (r.reps_min || r.reps_max ? `${r.reps_min || '?'} - ${r.reps_max || '?'}` : '-')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.carga_actual ? <span className="font-extrabold text-indigo-700">{r.carga_actual} <span className="text-[10px] font-semibold uppercase text-slate-500">{r.unidad_carga}</span></span> : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {r.descanso ? <span className="flex items-center justify-center gap-1 font-medium"><Clock className="w-4 h-4 text-slate-400"/> {r.descanso}s</span> : '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => setEditItem(r)} className="text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 className="w-5 h-5 inline" /></button>
                      {isActivo ? (
                        <button onClick={() => setDeleteId(r.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
                      ) : (
                        <button onClick={() => attemptReactivate(r)} className="text-slate-400 hover:text-emerald-500 transition-colors"><RefreshCw className="w-5 h-5 inline" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500"><ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />No hay configuraciones planificadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
            <span className="font-medium">Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, realizacionesFiltradas.length)} de {realizacionesFiltradas.length}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 font-medium disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4"/> Anterior</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 font-medium disabled:opacity-50 disabled:hover:text-slate-500 transition-colors">Siguiente <ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {viewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-sm" onClick={() => setViewImage(null)}>
          <div className="relative w-full max-w-5xl flex flex-col gap-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center text-white"><h3 className="text-xl font-bold drop-shadow-md">{viewImage.ejercicio_nombre}</h3><button onClick={() => setViewImage(null)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-full transition-colors"><X className="w-6 h-6"/></button></div>
            <img src={viewImage.ejercicio_imagen} className="w-full h-auto max-h-[70vh] object-contain rounded-2xl shadow-2xl bg-black/50 border border-white/10" />
          </div>
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Configurar Ejercicio" size="lg" colorTheme={modalTheme}>
        <RealizacionForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Configuración" size="lg" colorTheme={modalTheme}>
        {editItem && <RealizacionForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Archivar Configuración" description="¿Seguro que quieres archivar esta configuración? Las rutinas que ya la usen se mantendrán, pero no podrás añadirla a rutinas nuevas." variant="danger" confirmText="Inactivar"
      />

      <ConfirmModal 
        isOpen={!!reactivateId} onCancel={() => setReactivateId(null)} onConfirm={confirmReactivate}
        title="Restaurar Configuración" description="¿Quieres volver a activar esta configuración? Volverá a estar disponible para añadir a tus rutinas." confirmText="Restaurar" variant="success"
      />

      {/* NUEVO MODAL DE BLOQUEO (Alerta visual) */}
      <ConfirmModal 
        isOpen={!!blockedReactivateItem} 
        onCancel={() => setBlockedReactivateItem(null)} 
        onConfirm={() => setBlockedReactivateItem(null)}
        title="⚠️ Acción Bloqueada" 
        description={`No puedes restaurar esta configuración porque el ejercicio principal ("${blockedReactivateItem?.ejercicio_nombre}") está inactivo en el Diccionario de Ejercicios. Por favor, restaura primero el ejercicio maestro.`} 
        variant="danger" 
        confirmText="Entendido" 
        cancelText="Cerrar"
        hideCancel
      />
    </>
  );
};