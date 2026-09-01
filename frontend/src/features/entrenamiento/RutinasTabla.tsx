import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';
import { RutinaForm, type Rutina, type RutinaRealizacionDetalle } from './RutinaForm';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Clock, Activity, GripVertical, ChevronLeft, ChevronRight, Search, Filter, RefreshCw, Archive } from 'lucide-react';

export const RutinasTabla: React.FC = () => {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Rutina | null>(null);
  
  // Estados para los modales de las 3 acciones
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  
  const [expandedRutinaId, setExpandedRutinaId] = useState<string | null>(null);
  const [rutinaDetalles, setRutinaDetalles] = useState<Record<string, RutinaRealizacionDetalle[]>>({});
  const [collapsedFases, setCollapsedFases] = useState<Record<string, boolean>>({});

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRutinas = async () => {
    try {
      const res = await fetch('/api/rutinas');
      if (res.ok) setRutinas(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchRutinas();
    const handleRegistro = (e: any) => { 
      if (e.detail === 'rutina' || e.detail === 'realizacion') {
        fetchRutinas(); 
        setRutinaDetalles({});
        setExpandedRutinaId(null);
      }
    };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  // ==========================================
  // LÓGICA DE LAS 3 ACCIONES
  // ==========================================
  
  // 1. Borrado Físico (Desvincula historial y elimina)
  const handleHardDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/rutinas/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'rutina' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  // 2. Modificar Estado Lógico (Inactivar o Restaurar)
  const handleToggleState = async (id: string, activo: boolean) => {
    try {
      await fetch(`/api/rutinas/${id}/estado`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo })
      });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'rutina' }));
    } catch (e) { console.error(e); } 
    finally { 
      setArchiveId(null);
      setReactivateId(null);
    }
  };

  const toggleExpandRutina = async (rutinaId: string) => {
    if (expandedRutinaId === rutinaId) { setExpandedRutinaId(null); return; }
    setExpandedRutinaId(rutinaId);
    
    if (!rutinaDetalles[rutinaId]) {
      try {
        const res = await fetch(`/api/rutinas/${rutinaId}/realizaciones`);
        if (res.ok) {
          const data = await res.json(); 
          setRutinaDetalles(prev => ({ ...prev, [rutinaId]: data })); 
        }
      } catch (e) { console.error("Error cargando detalle", e); }
    }
  };

  const toggleFase = (rutinaId: string, fase: string) => setCollapsedFases(prev => ({ ...prev, [`${rutinaId}_${fase}`]: !prev[`${rutinaId}_${fase}`] }));

  const rutinasFiltradas = useMemo(() => {
    return rutinas.filter(r => {
      const cumpleEstado = filtroEstado === 'todos' || (filtroEstado === 'activos' && r.activo !== false) || (filtroEstado === 'inactivos' && r.activo === false);
      const cumpleBusqueda = r.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return cumpleEstado && cumpleBusqueda;
    });
  }, [rutinas, filtroEstado, searchTerm]);

  const totalPages = Math.ceil(rutinasFiltradas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = rutinasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [itemsPerPage, filtroEstado, searchTerm]);

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };
  const selectTheme = { borderNormal: 'border-slate-200', borderActive: 'border-indigo-400 ring-4 ring-indigo-50', textSelected: 'text-indigo-900', iconColor: 'text-indigo-500', optionSelectedBg: 'bg-indigo-50', optionSelectedText: 'text-indigo-700', optionHoverBg: 'hover:bg-indigo-50/50', optionHoverText: 'hover:text-indigo-900', checkIcon: 'text-indigo-500' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden h-full flex flex-col">
        
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-lg font-bold text-indigo-800 flex items-center gap-2 shrink-0"><Activity className="w-5 h-5"/> Mis Rutinas</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" placeholder="Buscar rutina..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none px-2"
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select 
                value={filtroEstado} onChange={(val) => setFiltroEstado(val as any)}
                options={[ { value: 'activos', label: 'Solo Activas' }, { value: 'inactivos', label: 'Solo Inactivas' }, { value: 'todos', label: 'Mostrar Todas' } ]}
                icon={<Filter className="w-4 h-4 text-slate-500" />} colorTheme={selectTheme}
              />
            </div>

            <button onClick={() => setIsAddOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm w-full sm:w-auto" style={{ height: '42px' }}>
              <Plus className="w-4 h-4" strokeWidth={3} /> Añadir
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="w-8 px-4"></th>
                <th className="w-12 px-4"></th>
                <th className="px-4 py-3 font-semibold w-16 text-center">Color</th>
                <th className="px-4 py-3 font-semibold">Nombre de Rutina</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(rutina => {
                const isActivo = rutina.activo !== false;
                const rowClass = `border-b border-slate-50 transition-colors group ${isActivo ? 'hover:bg-slate-50/50' : 'bg-slate-50/50 hover:bg-slate-100/50 opacity-80'}`;

                return (
                  <React.Fragment key={rutina.id}>
                    <tr className={rowClass}>
                      <td className="px-4 py-3 text-center"><div className={`w-3 h-3 rounded-full shadow-inner ${isActivo ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} title={isActivo ? 'Activa' : 'Inactiva'}></div></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleExpandRutina(rutina.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          {expandedRutinaId === rutina.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`w-6 h-6 rounded-md shadow-sm mx-auto border border-slate-200 ${!isActivo && 'grayscale opacity-50'}`} style={{ backgroundColor: rutina.color || '#ccc' }}></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-bold text-base ${isActivo ? 'text-slate-800' : 'text-slate-500'}`}>
                          {rutina.nombre} {!isActivo && <span className="ml-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest">(Inactiva)</span>}
                        </div>
                        {rutina.descripcion && <p className="text-xs text-slate-400 mt-0.5">{rutina.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                        <button onClick={() => setEditItem(rutina)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Editar"><Edit2 className="w-5 h-5 inline" /></button>
                        
                        {/* INACTIVAR / RESTAURAR */}
                        {isActivo ? (
                          <button onClick={() => setArchiveId(rutina.id)} className="text-slate-400 hover:text-amber-500 transition-colors" title="Archivar/Inactivar"><Archive className="w-5 h-5 inline" /></button>
                        ) : (
                          <button onClick={() => setReactivateId(rutina.id)} className="text-slate-400 hover:text-emerald-500 transition-colors" title="Restaurar/Activar"><RefreshCw className="w-5 h-5 inline" /></button>
                        )}
                        
                        {/* BORRADO FÍSICO */}
                        <button onClick={() => setDeleteId(rutina.id)} className="text-slate-400 hover:text-red-500 transition-colors ml-2" title="Borrar Definitivamente"><Trash2 className="w-5 h-5 inline" /></button>
                      </td>
                    </tr>

                    {expandedRutinaId === rutina.id && (
                      <tr className="bg-slate-50/50 border-b-2 border-slate-200">
                        <td colSpan={5} className="p-0">
                          <div className="px-6 py-6 animate-in slide-in-from-top-2 duration-200">
                            {!rutinaDetalles[rutina.id] ? (
                              <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                            ) : rutinaDetalles[rutina.id].length === 0 ? (
                              <div className="text-center text-slate-500 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">Esta rutina no tiene ejercicios planificados aún.</div>
                            ) : (
                              <div className="space-y-6 max-w-5xl mx-auto">
                                {['Calentamiento', 'Principal', 'Postentreno'].map(fase => {
                                  const ejerciciosFase = rutinaDetalles[rutina.id].filter(d => d.fase === fase);
                                  if (ejerciciosFase.length === 0) return null;
                                  
                                  const isCollapsed = collapsedFases[`${rutina.id}_${fase}`] || false;

                                  return (
                                    <div key={fase} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                      <button onClick={() => toggleFase(rutina.id, fase)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-100/50 hover:bg-slate-100 transition-colors border-b border-slate-200">
                                        <div className="flex items-center gap-3">
                                          <GripVertical className="w-4 h-4 text-slate-400" />
                                          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">{fase}</h4>
                                          <span className="bg-white text-slate-500 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-200">{ejerciciosFase.length}</span>
                                        </div>
                                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
                                      </button>

                                      {!isCollapsed && (
                                        <table className="w-full text-sm text-left">
                                          <thead className="bg-white text-slate-400 border-b border-slate-100 text-xs">
                                            <tr>
                                              <th className="px-4 py-2 font-semibold w-16 text-center">Nº</th>
                                              <th className="px-4 py-2 font-semibold">Ejercicio</th>
                                              <th className="px-4 py-2 font-semibold text-center">Series x Objetivo</th>
                                              <th className="px-4 py-2 font-semibold text-center">Desc. Entre Series</th>
                                              <th className="px-4 py-2 font-semibold text-center text-indigo-500">Desc. Posterior</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {ejerciciosFase.map(ej => {
                                              const isEjActivo = ej.realizacion_activa;
                                              return (
                                                <tr key={ej.id} className={`border-b border-slate-50 transition-colors ${isEjActivo ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-70'}`}>
                                                  <td className="px-4 py-2 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                      <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${isEjActivo ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} title={isEjActivo ? 'Activo' : 'Inactivo'}></div>
                                                      <span className="font-bold text-slate-400">{ej.orden}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-2">
                                                    <div className="flex items-center gap-3">
                                                      {ej.ejercicio_imagen && <img src={ej.ejercicio_imagen} alt="img" className={`w-8 h-8 rounded object-cover shadow-sm border border-slate-200 ${!isEjActivo && 'grayscale'}`} />}
                                                      <div>
                                                        <div className={`font-bold ${isEjActivo ? 'text-slate-700' : 'text-slate-500'}`}>
                                                          {ej.ejercicio_nombre} {!isEjActivo && <span className="ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest">(Inactivo)</span>}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-2 text-center font-bold text-slate-600">
                                                    {ej.series ? `${ej.series} x ` : ''}
                                                    {ej.unidad_objetivo === 'seg'
                                                      ? (ej.reps_min ? ej.reps_min : '-')
                                                      : (ej.reps_min === ej.reps_max && ej.reps_min 
                                                          ? ej.reps_min 
                                                          : (ej.reps_min || ej.reps_max ? `${ej.reps_min || '?'} - ${ej.reps_max || '?'}` : '-'))
                                                    }
                                                    {(ej.reps_min || ej.reps_max) && (
                                                      <span className="text-[11px] font-semibold text-slate-400 ml-1">
                                                        {ej.unidad_objetivo || 'reps'}
                                                      </span>
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-2 text-center text-slate-500">
                                                    {ej.descanso ? <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> {ej.descanso}s</span> : '-'}
                                                  </td>
                                                  <td className="px-4 py-2 text-center font-bold text-indigo-600 bg-indigo-50/30">
                                                    {ej.descanso_posterior ? `${ej.descanso_posterior}s` : '-'}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {rutinasFiltradas.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No hay rutinas que coincidan con la búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {rutinasFiltradas.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
            <div className="flex items-center gap-2 order-1 sm:order-none">
              <span className="font-semibold text-slate-600">Filas:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-indigo-500 font-medium shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <span className="font-medium text-slate-600 order-3 sm:order-none w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, rutinasFiltradas.length)} de {rutinasFiltradas.length} resultados
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

      <Modal preventClose isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Crear Nueva Rutina" size="xl" position="top" colorTheme={modalTheme}>
        <RutinaForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal preventClose isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Rutina" size="xl" position="top" colorTheme={modalTheme}>
        {editItem && <RutinaForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      {/* MODAL 1: INACTIVAR */}
      <ConfirmModal 
        isOpen={!!archiveId} onCancel={() => setArchiveId(null)} onConfirm={() => handleToggleState(archiveId!, false)}
        title="Archivar Rutina" 
        description="Al archivar esta rutina, dejará de aparecer en la pantalla principal para entrenar. Sin embargo, su historial y estadísticas se mantendrán intactas." 
        variant="secondary" confirmText="Archivar"
      />

      {/* MODAL 2: REACTIVAR */}
      <ConfirmModal 
        isOpen={!!reactivateId} onCancel={() => setReactivateId(null)} onConfirm={() => handleToggleState(reactivateId!, true)}
        title="Restaurar Rutina" 
        description="Esta rutina volverá a aparecer en tu lista de rutinas disponibles para entrenar." 
        confirmText="Restaurar"
        variant="success"
      />

      {/* MODAL 3: BORRADO FÍSICO */}
      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleHardDelete}
        title="Borrar Definitivamente" 
        description="⚠️ ATENCIÓN: Esta acción eliminará la rutina por completo de la base de datos. Todo el historial de entrenamientos asociado a ella quedará desvinculado (borrado físico). Solo haz esto si creaste la rutina por error." 
        variant="danger" confirmText="Borrar para siempre"
      />
    </>
  );
};