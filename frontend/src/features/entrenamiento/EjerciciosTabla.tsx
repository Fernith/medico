import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { EjercicioForm, type Ejercicio } from './EjercicioForm';
import { Plus, Edit2, Trash2, Image as ImageIcon, ZoomIn, X } from 'lucide-react';

interface EjerciciosTablaProps {
  ejercicios: Ejercicio[];
}

export const EjerciciosTabla: React.FC<EjerciciosTablaProps> = ({ ejercicios }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Ejercicio | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<Ejercicio | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/ejercicios/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'ejercicio' }));
      // Disparamos evento también por si este ejercicio estaba en alguna realización
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'realizacion' }));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteId(null);
    }
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
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-indigo-800">Diccionario de Ejercicios</h2>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-500/30"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>Añadir Ejercicio</span>
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="w-24"></th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Grupos Musculares</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ejercicios.map(e => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {e.imagen ? (
                      <button 
                        onClick={() => setViewImage(e)}
                        className="relative group block rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Ver imagen ampliada"
                      >
                        <img 
                          src={e.imagen} 
                          alt={e.nombre} 
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
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{e.nombre}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                    {e.tipo_entrenamiento_nombre ? (
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-slate-200">
                        {e.tipo_entrenamiento_nombre}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-indigo-600 font-medium">
                    {e.grupos_nombres?.join(', ') || 'Ninguno'}
                  </td>
                  
                  {/* Nueva celda de Descripción con limitador de líneas */}
                  <td className="px-4 py-3 text-slate-600">
                    {e.descripcion ? (
                      <div 
                        className="max-w-xs line-clamp-2 cursor-help" 
                        title={e.descripcion}
                      >
                        {e.descripcion}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button 
                      onClick={() => setEditItem(e)} 
                      className="text-slate-400 hover:text-indigo-500 transition-colors"
                      title="Editar ejercicio"
                    >
                      <Edit2 className="w-5 h-5 inline" />
                    </button>
                    <button 
                      onClick={() => setDeleteId(e.id)} 
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Borrar ejercicio"
                    >
                      <Trash2 className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {ejercicios.length === 0 && (
                <tr>
                  {/* Actualizado el colSpan a 5 por la nueva columna */}
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-50 rounded-full">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p>No hay ejercicios registrados en el diccionario.</p>
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
              <h3 className="text-xl md:text-2xl font-bold drop-shadow-md">{viewImage.nombre}</h3>
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
                src={viewImage.imagen} 
                alt={viewImage.nombre} 
                className="w-full h-auto max-h-[70vh] md:max-h-[75vh] object-contain rounded-2xl shadow-2xl bg-black/50 border border-white/10"
              />
            </div>

            {viewImage.descripcion && (
              <div className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/20 text-white shadow-xl">
                <p className="text-sm md:text-base leading-relaxed">{viewImage.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALES EDICIÓN */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir al Diccionario" size="lg" colorTheme={modalTheme}>
        <EjercicioForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Ejercicio" size="lg" colorTheme={modalTheme}>
        {editItem && <EjercicioForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar del Diccionario" 
        description="¿Seguro que quieres borrar este ejercicio? ADVERTENCIA: Se eliminará de todas las realizaciones y rutinas en las que esté planificado."
        variant="danger" confirmText="Borrar definitivamente"
      />
    </>
  );
};