import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Type, AlignLeft, Palette, Plus, Trash2, Clock, Activity } from 'lucide-react';
import { type RealizacionEjercicio } from './RealizacionForm';

export interface Rutina {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

export interface RutinaRealizacionDetalle {
  id: string;
  rutina_id: string;
  realizacion_id: string;
  fase: string;
  orden: number;
  descanso_posterior: number | null;
  ejercicio_nombre: string;
  ejercicio_imagen: string;
  equipamiento_nombre: string | null;
  series: number | null;
  reps_min: number | null;
  reps_max: number | null;
  carga_actual: number | null;
  unidad_carga: string | null;
  descanso: number | null;
}

interface ItemFase {
  tempId: string;
  realizacion_id: string;
  ejercicio_nombre: string;
  descanso_posterior: string;
}

interface RutinaFormProps {
  initialData?: Rutina | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// --- SUB-COMPONENTE INTERNO PARA CADA FASE ---
const FaseBuilder: React.FC<{
  fase: string;
  items: ItemFase[];
  realizaciones: RealizacionEjercicio[];
  onAdd: (item: ItemFase) => void;
  onRemove: (tempId: string) => void;
}> = ({ fase, items, realizaciones, onAdd, onRemove }) => {
  const [selId, setSelId] = useState<string | null>(null);
  const [descanso, setDescanso] = useState('');

  const handleAdd = () => {
    if (!selId) return;
    const real = realizaciones.find(r => r.id === selId);
    if (!real) return;
    onAdd({
      tempId: Math.random().toString(36).substr(2, 9),
      realizacion_id: selId,
      ejercicio_nombre: `${real.ejercicio_nombre} ${real.equipamiento_nombre ? `(${real.equipamiento_nombre})` : ''}`,
      descanso_posterior: descanso
    });
    setSelId(null);
    setDescanso('');
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{fase}</h4>
        <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-full">{items.length} ejercicios</span>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Añadidor en línea */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Select 
              searchable placeholder="Selecciona un ejercicio planificado..."
              value={selId} onChange={setSelId}
              options={realizaciones.map(r => ({ 
                value: r.id, 
                label: `${r.ejercicio_nombre} ${r.equipamiento_nombre ? `(${r.equipamiento_nombre})` : ''} - ${r.series ? r.series+'x' : ''}${r.reps_min || '?'}`
              }))}
              icon={<Activity className="w-5 h-5" />}
            />
          </div>
          <div className="w-full md:w-40">
            <Input type="number" placeholder="Descanso (s)" value={descanso} onChange={(e) => setDescanso(e.target.value)} icon={<Clock className="w-5 h-5" />} />
          </div>
          <button type="button" onClick={handleAdd} disabled={!selId} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> Añadir
          </button>
        </div>

        {/* Tabla de elementos añadidos */}
        {items.length > 0 && (
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold w-12 text-center">Nº</th>
                  <th className="px-3 py-2 font-semibold">Ejercicio</th>
                  <th className="px-3 py-2 font-semibold text-center w-32">Desc. Post.</th>
                  <th className="px-3 py-2 font-semibold text-right w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.tempId} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-700">{item.ejercicio_nombre}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{item.descanso_posterior ? `${item.descanso_posterior}s` : '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => onRemove(item.tempId)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- FORMULARIO PRINCIPAL ---
export const RutinaForm: React.FC<RutinaFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realizaciones, setRealizaciones] = useState<RealizacionEjercicio[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    color: initialData?.color || '#4f46e5',
  });

  const [fases, setFases] = useState<Record<string, ItemFase[]>>({
    Calentamiento: [],
    Principal: [],
    Postentreno: []
  });

  useEffect(() => {
    const fetchData = async () => {
      // 1. Cargar catálogo de realizaciones
      const resReal = await fetch('/api/realizaciones');
      if (resReal.ok) {
        const dataReal = await resReal.json();
        setRealizaciones(dataReal);

        // 2. Si estamos editando, cargar los ejercicios de esta rutina y distribuirlos
        if (initialData) {
          const resRut = await fetch(`/api/rutinas/${initialData.id}/realizaciones`);
          if (resRut.ok) {
            const detalles: RutinaRealizacionDetalle[] = await resRut.json();
            const nuevasFases: Record<string, ItemFase[]> = { Calentamiento: [], Principal: [], Postentreno: [] };
            
            detalles.forEach(d => {
              if (nuevasFases[d.fase]) {
                nuevasFases[d.fase].push({
                  tempId: d.id,
                  realizacion_id: d.realizacion_id,
                  ejercicio_nombre: `${d.ejercicio_nombre} ${d.equipamiento_nombre ? `(${d.equipamiento_nombre})` : ''}`,
                  descanso_posterior: d.descanso_posterior ? d.descanso_posterior.toString() : ''
                });
              }
            });
            setFases(nuevasFases);
          }
        }
      }
    };
    fetchData();
  }, [initialData]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;
    setIsSubmitting(true);
    
    try {
      // 1. Crear o Actualizar la Rutina Base
      let rutinaId = initialData?.id;
      if (!rutinaId) {
        const res = await fetch('/api/rutinas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        rutinaId = data.id;
      } else {
        const res = await fetch(`/api/rutinas/${rutinaId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (!res.ok) throw new Error(await res.text());
        
        // Al editar, borramos todas las relaciones antiguas para meter las nuevas limpias
        const resAntiguos = await fetch(`/api/rutinas/${rutinaId}/realizaciones`);
        const antiguos: RutinaRealizacionDetalle[] = await resAntiguos.json();
        await Promise.all(antiguos.map(a => fetch(`/api/rutina-realizacion/${a.id}`, { method: 'DELETE' })));
      }

      // 3. Preparar el array de todas las realizaciones nuevas a insertar
      const inserciones: {
        rutina_id: string;
        realizacion_id: string;
        fase: string;
        orden: number;
        descanso_posterior: number | null;
      }[] = [];
      
      for (const [faseNombre, items] of Object.entries(fases)) {
        items.forEach((item, index) => {
          inserciones.push({
            rutina_id: rutinaId!, // <--- ¡Añade el signo de exclamación aquí!
            realizacion_id: item.realizacion_id,
            fase: faseNombre,
            orden: index + 1,
            descanso_posterior: item.descanso_posterior ? parseInt(item.descanso_posterior) : null
          });
        });
      }

      // 3. Insertar todas las relaciones secuencialmente
      await Promise.all(inserciones.map(payload => 
        fetch('/api/rutina-realizacion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      ));

      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'rutina' }));
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la rutina");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFase = (fase: string, item: ItemFase) => {
    setFases(prev => ({ ...prev, [fase]: [...prev[fase], item] }));
  };

  const handleRemoveFase = (fase: string, tempId: string) => {
    setFases(prev => ({ ...prev, [fase]: prev[fase].filter(i => i.tempId !== tempId) }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-8 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
      
      {/* DATOS BÁSICOS */}
      <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4">
        <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2 mb-2">
          <AlignLeft className="w-5 h-5 text-indigo-500"/> Datos Generales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
          <Input type="text" label="Nombre de la Rutina" placeholder="Ej: Empuje - Día 1" value={formData.nombre} onChange={(e) => setFormData(p => ({...p, nombre: e.target.value}))} required icon={<Type className="w-5 h-5" />} />
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Color Identificativo</label>
            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
              <Palette className="w-5 h-5 text-slate-400" />
              <input type="color" value={formData.color} onChange={(e) => setFormData(p => ({...p, color: e.target.value}))} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
            </div>
          </div>
        </div>
        <Input type="text" label="Descripción (Opcional)" placeholder="Ej: Enfocado en fuerza..." value={formData.descripcion} onChange={(e) => setFormData(p => ({...p, descripcion: e.target.value}))} icon={<AlignLeft className="w-5 h-5" />} />
      </div>

      {/* BLOQUES DE FASES */}
      <div className="space-y-6">
        <h3 className="font-bold text-slate-800 text-lg border-b border-slate-200 pb-2">Planificación de Ejercicios</h3>
        
        {['Calentamiento', 'Principal', 'Postentreno'].map(fase => (
          <FaseBuilder 
            key={fase} fase={fase} 
            items={fases[fase]} realizaciones={realizaciones}
            onAdd={(item) => handleAddFase(fase, item)} 
            onRemove={(tempId) => handleRemoveFase(fase, tempId)}
          />
        ))}
      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-100 sticky bottom-0 bg-white/90 backdrop-blur pb-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !formData.nombre} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {isSubmitting ? 'Guardando Rutina...' : (initialData ? 'Actualizar Rutina' : 'Guardar Rutina')}
        </button>
      </div>
    </form>
  );
};