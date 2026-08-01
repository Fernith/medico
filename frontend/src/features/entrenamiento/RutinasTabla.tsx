import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { RutinaForm, type Rutina, type RutinaRealizacionDetalle } from './RutinaForm';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Clock, Activity, GripVertical } from 'lucide-react';

export const RutinasTabla: React.FC = () => {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Rutina | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [expandedRutinaId, setExpandedRutinaId] = useState<string | null>(null);
  const [rutinaDetalles, setRutinaDetalles] = useState<Record<string, RutinaRealizacionDetalle[]>>({});
  const [collapsedFases, setCollapsedFases] = useState<Record<string, boolean>>({});

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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/rutinas/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'rutina' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
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

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-indigo-800 flex items-center gap-2"><Activity className="w-5 h-5"/> Mis Rutinas</h2>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-500/30">
            <Plus className="w-4 h-4" strokeWidth={3} /> Añadir Rutina
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold w-12"></th>
                <th className="px-4 py-3 font-semibold w-16 text-center">Color</th>
                <th className="px-4 py-3 font-semibold">Nombre de Rutina</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutinas.map(rutina => (
                <React.Fragment key={rutina.id}>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleExpandRutina(rutina.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        {expandedRutinaId === rutina.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-6 h-6 rounded-md shadow-sm mx-auto border border-slate-200" style={{ backgroundColor: rutina.color || '#ccc' }}></div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 text-base">{rutina.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{rutina.descripcion || '-'}</td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => setEditItem(rutina)} className="text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 className="w-5 h-5 inline" /></button>
                      <button onClick={() => setDeleteId(rutina.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
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
                                            const isActivo = ej.realizacion_activa;
                                            return (
                                              <tr key={ej.id} className={`border-b border-slate-50 transition-colors ${isActivo ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-70'}`}>
                                                <td className="px-4 py-2 text-center">
                                                  <div className="flex items-center justify-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${isActivo ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} title={isActivo ? 'Activo' : 'Inactivo'}></div>
                                                    <span className="font-bold text-slate-400">{ej.orden}</span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                  <div className="flex items-center gap-3">
                                                    {ej.ejercicio_imagen && <img src={ej.ejercicio_imagen} alt="img" className={`w-8 h-8 rounded object-cover shadow-sm border border-slate-200 ${!isActivo && 'grayscale'}`} />}
                                                    <div>
                                                      <div className={`font-bold ${isActivo ? 'text-slate-700' : 'text-slate-500'}`}>
                                                        {ej.ejercicio_nombre} {!isActivo && <span className="ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest">(Inactivo)</span>}
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
              ))}
              {rutinas.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No hay rutinas creadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APLICAMOS POSITION="TOP" A LOS MODALES */}
      <Modal preventClose isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Crear Nueva Rutina" size="xl" position="top" colorTheme={modalTheme}>
        <RutinaForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal preventClose isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Rutina" size="xl" position="top" colorTheme={modalTheme}>
        {editItem && <RutinaForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Rutina" description="¿Seguro que quieres borrar esta rutina? Las planificaciones de ejercicios se mantendrán intactas." variant="danger" confirmText="Borrar"
      />
    </>
  );
};