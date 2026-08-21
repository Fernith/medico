import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Pause, Play, Activity, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';
import { MedicacionActivaForm, type MedicacionActiva } from './MedicacionActivaForm';
import { type Medicamento } from './MedicamentoForm';

interface Props { activas: MedicacionActiva[]; medicamentos: Medicamento[]; }

export const MedicacionesActivasTabla: React.FC<Props> = ({ activas, medicamentos }) => {
  const [editingItem, setEditingItem] = useState<MedicacionActiva | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [filtroEstado, setFiltroEstado] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // PAGINACIÓN: Inicializada a 5
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/medicaciones-activas/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicacion_activa' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const handleToggle = async (id: string) => {
    try {
      await fetch(`/api/medicaciones-activas/${id}/toggle`, { method: 'PATCH' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicacion_activa' }));
    } catch (err) { console.error(err); }
  };

  const formatearFecha = (isoString: string) => {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
  };

  const modalTheme = { titleColor: 'text-teal-900', headerBorder: 'border-teal-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-teal-600', modalBorder: 'border-teal-400' };
  const selectTheme = { borderNormal: 'border-slate-200', borderActive: 'border-teal-400 ring-4 ring-teal-50', textSelected: 'text-teal-900', iconColor: 'text-teal-500', optionSelectedBg: 'bg-teal-50', optionSelectedText: 'text-teal-700', optionHoverBg: 'hover:bg-teal-50/50', optionHoverText: 'hover:text-teal-900', checkIcon: 'text-teal-500' };

  // Filtrado y Paginación combinados
  const activasFiltradas = useMemo(() => {
    const list = activas.filter(a => {
      const cumpleEstado = filtroEstado === 'todos' || (filtroEstado === 'activos' && a.activo) || (filtroEstado === 'inactivos' && !a.activo);
      const cumpleBusqueda = a.medicamento_nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return cumpleEstado && cumpleBusqueda;
    });
    return list;
  }, [activas, filtroEstado, searchTerm]);

  const totalPages = Math.ceil(activasFiltradas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = activasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [filtroEstado, searchTerm, itemsPerPage]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-lg font-bold text-teal-800 shrink-0 flex items-center gap-2"><Activity className="w-5 h-5 text-teal-600" /> Planificación de Tomas</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* BUSCADOR */}
            <div className="relative w-full sm:w-64 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" placeholder="Buscar planificación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none px-2"
              />
            </div>

            {/* SELECTOR DE ESTADO */}
            <div className="w-full sm:w-48">
              <Select 
                value={filtroEstado} onChange={(val) => setFiltroEstado(val as any)}
                options={[ { value: 'activos', label: 'Solo Activos' }, { value: 'inactivos', label: 'Solo Pausados' }, { value: 'todos', label: 'Mostrar Todos' } ]}
                icon={<Filter className="w-4 h-4 text-slate-500" />} colorTheme={selectTheme}
              />
            </div>

            <button onClick={() => { setEditingItem(null); setIsAddOpen(true); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-teal-500/30 w-full sm:w-auto" style={{ height: '42px' }}>
              <Plus className="w-4 h-4" strokeWidth={3} /> <span>Planificar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="w-8 px-4"></th>
                <th className="px-4 py-3 font-semibold">Medicamento y Anotaciones</th>
                <th className="px-4 py-3 font-semibold">Toma</th>
                <th className="px-4 py-3 font-semibold">Frecuencia</th>
                <th className="px-4 py-3 font-semibold">Periodo</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(act => {
                const isActivo = act.activo;
                const rowClass = `border-b border-slate-50 transition-colors ${isActivo ? 'hover:bg-slate-50/50' : 'bg-slate-50/50 hover:bg-slate-100/50 opacity-80'}`;
                
                const isDosis = ['Polvo', 'Líquido', 'Crema', 'Inyectable'].includes(act.formato);
                const medBase = medicamentos.find(m => m.id === act.medicamento_id);
                const dosisTotal = medBase ? (act.cantidad * medBase.dosis) : act.cantidad;

                return (
                  <tr key={act.id} className={rowClass}>
                    <td className="px-4 py-3 text-center align-top pt-4"><div className={`w-3 h-3 rounded-full shadow-inner ${isActivo ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`} title={isActivo ? 'Activo' : 'Pausado'}></div></td>
                    <td className="px-4 py-3 align-top">
                      <div className={`font-bold ${isActivo ? 'text-slate-800' : 'text-slate-500'}`}>
                        {act.medicamento_nombre} {!isActivo && <span className="ml-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest">(Pausado)</span>}
                      </div>
                      {/* CORRECCIÓN: Mostrar descripción entera (whitespace-normal) */}
                      {act.anotaciones && (
                        <div className="text-xs text-slate-500 mt-1 whitespace-normal leading-relaxed max-w-sm">
                          {act.anotaciones}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 font-bold text-teal-700 align-top pt-4">
                      {isDosis 
                        ? `${act.cantidad} Dosis de ${dosisTotal} ${act.unidad_dosis}` 
                        : `${act.cantidad} ${act.formato}(s) (${dosisTotal} ${act.unidad_dosis})`
                      }
                    </td>
                    
                    <td className="px-4 py-3 text-slate-600 font-medium align-top pt-4">{act.frecuencia}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 align-top pt-4">
                      <div><span className="font-semibold text-slate-700">De:</span> {formatearFecha(act.fecha_inicio)}</div>
                      <div><span className="font-semibold text-slate-700">A:</span> {act.fecha_fin ? formatearFecha(act.fecha_fin) : 'Indefinido'}</div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap align-top pt-4">
                      <button onClick={() => handleToggle(act.id)} className={`transition-colors ${act.activo ? 'text-slate-400 hover:text-amber-500' : 'text-slate-400 hover:text-emerald-500'}`} title={act.activo ? 'Pausar' : 'Reanudar'}>
                        {act.activo ? <Pause className="w-5 h-5 inline" fill="currentColor" /> : <Play className="w-5 h-5 inline" fill="currentColor" />}
                      </button>
                      <button onClick={() => { setEditingItem(act); setIsAddOpen(true); }} className="text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="w-5 h-5 inline" /></button>
                      <button onClick={() => setDeleteId(act.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500"><Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />No hay planificaciones.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN RESPONSIVE */}
        {activasFiltradas.length > 0 && (
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
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, activasFiltradas.length)} de {activasFiltradas.length} resultados
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingItem ? "Editar Planificación" : "Nueva Planificación"} colorTheme={modalTheme} size="lg">
        <MedicacionActivaForm initialData={editingItem} medicamentos={medicamentos} onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Planificación" 
        description="⚠️ ¡ATENCIÓN! ¿Seguro que deseas eliminar esta planificación de tomas? Esta acción no se puede deshacer (el historial de tomas realizadas se conservará)."
        variant="danger" confirmText="Borrar definitivamente"
      />
    </>
  );
};