import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight, Clock, CheckCircle2, ArrowUpDown, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';
import { HistorialMedicacionForm, type HistorialMedicacion } from './HistorialMedicacionForm';

interface Toast {
  id: string;
  medNombre: string;
  historialId: string;
}

export const HistorialMedicacionesTabla: React.FC = () => {
  const [historial, setHistorial] = useState<HistorialMedicacion[]>([]);
  const [editingItem, setEditingItem] = useState<HistorialMedicacion | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'tomados'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);
  
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistorial = async () => {
    try {
      const res = await fetch('/api/historial-medicacion');
      if (res.ok) setHistorial(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchHistorial();
    const handleRegistro = (e: any) => { if (e.detail === 'historial_medicacion') fetchHistorial(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/historial-medicacion/${deleteId}`, { method: 'DELETE' });
      fetchHistorial();
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const handleMarcarTomado = async (med: HistorialMedicacion) => {
    setHistorial(prev => prev.map(h => h.id === med.id ? { ...h, pendiente: false } : h));
    try {
      await fetch(`/api/historial-medicacion/${med.id}/tomado`, { method: 'PATCH' });
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, medNombre: med.medicamento_nombre, historialId: med.id }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 5000);
    } catch (err) { console.error(err); fetchHistorial(); }
  };

  const handleDeshacer = async (toast: Toast) => {
    setToasts(prev => prev.filter(t => t.id !== toast.id));
    setHistorial(prev => prev.map(h => h.id === toast.historialId ? { ...h, pendiente: true } : h));
    try {
      await fetch(`/api/historial-medicacion/${toast.historialId}/pendiente`, { method: 'PATCH' });
    } catch (err) { console.error(err); fetchHistorial(); }
  };

  const formatearFecha = (isoString: string) => {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
  };

  const nombresUnicos = Array.from(new Set(historial.map(h => h.medicamento_nombre)));
  const filteredSuggestions = nombresUnicos.filter(n => n.toLowerCase().includes(searchTerm.toLowerCase()) && n.toLowerCase() !== searchTerm.toLowerCase());

  const historialProcesado = useMemo(() => {
    let list = historial.filter(h => {
      const cumpleEstado = filtroEstado === 'todos' || (filtroEstado === 'pendientes' && h.pendiente) || (filtroEstado === 'tomados' && !h.pendiente);
      const cumpleBusqueda = h.medicamento_nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return cumpleEstado && cumpleBusqueda;
    });
    list.sort((a, b) => {
      const diff = new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime();
      return sortDesc ? diff : -diff;
    });
    return list;
  }, [historial, filtroEstado, searchTerm, sortDesc]);

  const totalPages = Math.ceil(historialProcesado.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = historialProcesado.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [filtroEstado, searchTerm, itemsPerPage]);

  const modalTheme = { titleColor: 'text-teal-900', headerBorder: 'border-teal-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-teal-600', modalBorder: 'border-teal-400' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden flex flex-col">
        <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-lg font-bold text-teal-800 shrink-0 flex items-center gap-2">Historial de Tomas</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" placeholder="Buscar medicamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none px-2"
              />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-slate-100 rounded-md transition-colors shrink-0"><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>}
              {isSearchFocused && filteredSuggestions.length > 0 && (
                <ul className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto py-1 custom-scrollbar">
                  {filteredSuggestions.map(s => <li key={s} onMouseDown={(e) => { e.preventDefault(); setSearchTerm(s); setIsSearchFocused(false); }} className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-slate-700 text-sm font-medium transition-colors">{s}</li>)}
                </ul>
              )}
            </div>
            <div className="w-full sm:w-48">
              <Select value={filtroEstado} onChange={(val) => setFiltroEstado(val as any)} options={[ { value: 'todos', label: 'Todos' }, { value: 'pendientes', label: 'Solo Pendientes' }, { value: 'tomados', label: 'Solo Tomados' } ]} icon={<Filter className="w-4 h-4 text-slate-500" />} colorTheme={{ borderActive: 'border-teal-400 ring-4 ring-teal-50', iconColor: 'text-teal-500' }} />
            </div>
          </div>
        </div>

        {/* CORRECCIÓN: Eliminado min-h-[300px] */}
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="w-12 px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 font-semibold">Medicamento</th>
                <th className="px-4 py-3 font-semibold">Toma</th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:text-teal-600 transition-colors" onClick={() => setSortDesc(!sortDesc)}>
                  <div className="flex items-center gap-1">Fecha y Hora <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(h => {
                const isDosis = ['Polvo', 'Líquido', 'Crema', 'Inyectable'].includes(h.formato);
                const dosisTotal = h.cantidad_tomada * h.dosis_base;

                return (
                  <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      {h.pendiente 
                        ? <button onClick={() => handleMarcarTomado(h)} title="Marcar como tomado" className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors"><Clock className="w-5 h-5 text-orange-500 hover:scale-110 transition-transform" /></button>
                        : <div className="p-1.5"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></div>
                      }
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{h.medicamento_nombre}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">
                      {isDosis ? `${h.cantidad_tomada} Dosis de ${dosisTotal} ${h.unidad_dosis}` : `${h.cantidad_tomada} ${h.formato}(s) (${dosisTotal} ${h.unidad_dosis})`}
                    </td>
                    <td className={`px-4 py-3 font-medium ${h.pendiente ? 'text-orange-600' : 'text-slate-600'}`}>{formatearFecha(h.fecha_hora)}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => setEditingItem(h)} className="text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="w-5 h-5 inline" /></button>
                      <button onClick={() => setDeleteId(h.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No hay registros en el historial.</td></tr>}
            </tbody>
          </table>
        </div>

        {historialProcesado.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
            <div className="flex items-center gap-2 order-1 sm:order-none">
              <span className="font-semibold text-slate-600">Filas:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-teal-500 font-medium shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <span className="font-medium text-slate-600 order-3 sm:order-none w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, historialProcesado.length)} de {historialProcesado.length} resultados
            </span>

            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm order-2 sm:order-none ml-auto sm:ml-0">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
              <span className="font-bold text-slate-700 min-w-[3rem] text-center">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Editar Toma" colorTheme={modalTheme}>
        {editingItem && <HistorialMedicacionForm initialData={editingItem} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />}
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete} title="Borrar Toma" description="⚠️ ¿Seguro que deseas eliminar este registro del historial? Esta acción no afectará a tus planificaciones activas." variant="danger" confirmText="Borrar" />

      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className="bg-white border border-teal-100 px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
              <p className="text-sm font-medium text-slate-600">
                Has marcado <span className="font-bold text-teal-600">{toast.medNombre}</span> como tomado.
              </p>
              <button onClick={() => handleDeshacer(toast)} className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-100 transition-colors uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100/50">
                Deshacer
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};