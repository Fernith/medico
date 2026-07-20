import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { RealizacionForm, type RealizacionEjercicio } from './RealizacionForm';
import { Plus, Edit2, Trash2, Clock, Image as ImageIcon, ZoomIn, X } from 'lucide-react';

export const RealizacionTabla: React.FC = () => {
  const [realizaciones, setRealizaciones] = useState<RealizacionEjercicio[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<RealizacionEjercicio | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<RealizacionEjercicio | null>(null);

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
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const modalTheme = {
    titleColor: 'text-indigo-900',
    headerBorder: 'border-indigo-100',
    closeIconColor: 'text-slate-400',
    closeIconHover: 'hover:text-indigo-600',
    modalBorder: 'border-indigo-400',
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden h-full flex flex-col">
        {/* Cabecera igual a la de Ejercicios */}
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-indigo-800">Ejercicios Planificados</h2>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-500/30"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>Añadir Realización</span>
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            {/* Títulos de columnas iguales a los de Ejercicios */}
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="w-24"></th>
                <th className="px-4 py-3 font-semibold">Ejercicio</th>
                <th className="px-4 py-3 font-semibold">Equipamiento</th>
                <th className="px-4 py-3 font-semibold text-center">Series x Reps</th>
                <th className="px-4 py-3 font-semibold text-center">Carga</th>
                <th className="px-4 py-3 font-semibold text-center">Descanso</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {realizaciones.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  
                  {/* Imagen Separada y con Lightbox, igual que en el catálogo */}
                  <td className="px-4 py-3">
                    {r.ejercicio_imagen ? (
                      <button 
                        onClick={() => setViewImage(r)}
                        className="relative group block rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Ver imagen ampliada"
                      >
                        <img 
                          src={r.ejercicio_imagen} 
                          alt={r.ejercicio_nombre} 
                          className="w-12 h-12 object-cover border border-slate-200 shadow-sm group-hover:opacity-70 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-900/20">
                          <ZoomIn className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-800">{r.ejercicio_nombre}</td>
                  
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {r.equipamiento_nombre ? <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs">{r.equipamiento_nombre}</span> : '-'}
                  </td>
                  
                  <td className="px-4 py-3 text-center text-slate-700 font-bold">
                    {r.series ? `${r.series} x ` : ''}
                    {r.reps_min === r.reps_max && r.reps_min ? r.reps_min : (r.reps_min || r.reps_max ? `${r.reps_min || '?'} - ${r.reps_max || '?'}` : '-')}
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    {r.carga_actual ? (
                      <span className="font-extrabold text-indigo-700">{r.carga_actual} <span className="text-xs font-semibold uppercase text-slate-500">{r.unidad_carga}</span></span>
                    ) : '-'}
                  </td>
                  
                  <td className="px-4 py-3 text-center text-slate-600">
                    {r.descanso ? <span className="flex items-center justify-center gap-1 font-medium"><Clock className="w-4 h-4 text-slate-400"/> {r.descanso}s</span> : '-'}
                  </td>
                  
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => setEditItem(r)} className="text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 className="w-5 h-5 inline" /></button>
                    <button onClick={() => setDeleteId(r.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
                  </td>
                </tr>
              ))}
              {realizaciones.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-50 rounded-full">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p>No hay realizaciones planificadas.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LIGHTBOX DE IMAGEN */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setViewImage(null)}
        >
          <div 
            className="relative w-full max-w-5xl flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center text-white">
              <h3 className="text-xl md:text-2xl font-bold drop-shadow-md">{viewImage.ejercicio_nombre}</h3>
              <button 
                onClick={() => setViewImage(null)}
                className="p-2 bg-white/10 hover:bg-rose-500 rounded-full transition-colors backdrop-blur-md text-white"
                title="Cerrar"
              >
                <X className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>

            <div className="relative w-full flex justify-center">
              <img 
                src={viewImage.ejercicio_imagen} 
                alt={viewImage.ejercicio_nombre} 
                className="w-full h-auto max-h-[70vh] md:max-h-[75vh] object-contain rounded-2xl shadow-2xl bg-black/50 border border-white/10"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODALES EDICIÓN */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Configurar Ejercicio" size="lg" colorTheme={modalTheme}>
        <RealizacionForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Configuración" size="lg" colorTheme={modalTheme}>
        {editItem && <RealizacionForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Realización" description="¿Seguro que quieres borrar esta configuración de ejercicio?" variant="danger" confirmText="Borrar"
      />
    </>
  );
};