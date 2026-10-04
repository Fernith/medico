import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Hash, Scale, Clock, Activity, Target, Dumbbell, Type } from 'lucide-react'; // <-- Añadido Type
import { type Ejercicio } from './EjercicioForm';
import { apiFetch } from '../../api/client';


export interface RealizacionEjercicio {
  id: string;
  nombre?: string | null; // <-- NUEVO
  ejercicio_id: string;
  ejercicio_nombre: string;
  ejercicio_imagen: string;
  equipamiento_id?: string | null;
  equipamiento_nombre?: string | null;
  carga_actual?: number | null;
  unidad_carga?: string;
  series?: number | null;
  reps_min?: number | null;
  reps_max?: number | null;
  descanso?: number | null;
  activo: boolean;
  ejercicio_activo?: boolean | null;
  unidad_objetivo?: string;
}

interface RealizacionFormProps {
  initialData?: RealizacionEjercicio | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RealizacionForm: React.FC<RealizacionFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [equipamientos, setEquipamientos] = useState<{id: string, nombre: string}[]>([]);

  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '', // <-- NUEVO
    ejercicio_id: initialData?.ejercicio_id || '',
    equipamiento_id: initialData?.equipamiento_id || '',
    carga_actual: initialData?.carga_actual?.toString() || '',
    unidad_carga: initialData?.unidad_carga || 'kg',
    series: initialData?.series?.toString() || '',
    reps_min: initialData?.reps_min?.toString() || '',
    reps_max: initialData?.reps_max?.toString() || '',
    descanso: initialData?.descanso?.toString() || '',
    unidad_objetivo: initialData?.unidad_objetivo || 'reps',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [resEj, resEq] = await Promise.all([
        apiFetch('/api/ejercicios'),
        apiFetch('/api/equipamiento') 
      ]);
      if (resEj.ok) setEjercicios(await resEj.json());
      if (resEq.ok) setEquipamientos(await resEq.json());
    };
    fetchData();
  }, []);

  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => {
      const newState = { ...prev, [campo]: valor };
      // AUTORELLENADO DE NOMBRE:
      if (campo === 'ejercicio_id') {
        const ej = ejercicios.find(e => e.id === valor);
        if (ej && (!prev.nombre || prev.nombre === (ejercicios.find(e => e.id === prev.ejercicio_id)?.nombre))) {
          newState.nombre = ej.nombre;
        }
      }
      return newState;
    });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.ejercicio_id) { alert("Debes seleccionar un ejercicio"); return; }
    if (!formData.nombre) { alert("Debes asignarle un nombre a esta configuración"); return; }
    
    setIsSubmitting(true);
    try {
      const payload = {
        nombre: formData.nombre, // <-- NUEVO
        ejercicio_id: formData.ejercicio_id,
        equipamiento_id: formData.equipamiento_id || null,
        carga_actual: formData.carga_actual ? parseFloat(formData.carga_actual) : null,
        unidad_carga: formData.unidad_carga || null,
        series: formData.series ? parseInt(formData.series) : null,
        reps_min: formData.reps_min ? parseInt(formData.reps_min) : null,
        reps_max: formData.reps_max ? parseInt(formData.reps_max) : null,
        descanso: formData.descanso ? parseInt(formData.descanso) : null,
        unidad_objetivo: formData.unidad_objetivo || 'reps',
      };

      const url = initialData ? `/api/realizaciones/${initialData.id}` : '/api/realizaciones';
      const res = await apiFetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'realizacion' }));
        onSuccess();
      } else {
        alert(`Error: ${await res.text()}`);
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const inputTheme = { borderNormal: 'border-slate-200', borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500', iconColor: 'text-indigo-500' };
  const selectTheme = { borderNormal: 'border-slate-200', borderActive: 'border-indigo-400 ring-4 ring-indigo-50', iconColor: 'text-indigo-500', optionSelectedBg: 'bg-indigo-50', optionSelectedText: 'text-indigo-800' };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-4">
        
        {/* NUEVO CAMPO NOMBRE OBLIGATORIO */}
        <Input 
          type="text" 
          label="Nombre de esta Configuración" 
          placeholder="Ej: Press Banca Fuerza 5x5" 
          value={formData.nombre} 
          onChange={(e) => handleChange('nombre', e.target.value)} 
          required
          colorTheme={inputTheme} 
          icon={<Type className="w-5 h-5" />} 
        />

        {/* FILA DE EJERCICIO Y EQUIPAMIENTO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Ejercicio Base</label>
            <Select 
              searchable
              value={formData.ejercicio_id}
              onChange={(val) => handleChange('ejercicio_id', val)}
              options={ejercicios.filter(e => e.activo !== false).map(e => ({ value: e.id, label: e.nombre }))}
              icon={<Activity className="w-5 h-5" />}
              colorTheme={selectTheme}
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Equipamiento <span className="text-slate-400 font-normal">(Opcional)</span></label>
            <Select 
              searchable
              value={formData.equipamiento_id}
              onChange={(val) => handleChange('equipamiento_id', val)}
              options={[{ value: '', label: 'Ninguno / Por defecto' }, ...equipamientos.map(e => ({ value: e.id, label: e.nombre }))]}
              icon={<Dumbbell className="w-5 h-5" />}
              colorTheme={selectTheme}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <Input type="number" label={<span>Series <span className="text-gray-400 font-normal">(Opcional)</span></span> as any} placeholder="Ej: 4" value={formData.series} onChange={(e) => handleChange('series', e.target.value)} colorTheme={inputTheme} icon={<Hash className="w-5 h-5" />} />
          <Input type="number" label={<span>Descanso (segundos) <span className="text-gray-400 font-normal">(Opcional)</span></span> as any} placeholder="Ej: 90" value={formData.descanso} onChange={(e) => handleChange('descanso', e.target.value)} colorTheme={inputTheme} icon={<Clock className="w-5 h-5" />} />
        </div>

        <div className={`grid ${formData.unidad_objetivo === 'seg' || formData.unidad_objetivo === 'min' ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
          <Input 
            type="number" 
            label={<span>{formData.unidad_objetivo === 'seg' ? "Tiempo (segundos)" : formData.unidad_objetivo === 'min' ? "Tiempo (minutos)" : "Reps Mínimas"} <span className="text-gray-400 font-normal">(Opcional)</span></span> as any} 
            placeholder={formData.unidad_objetivo === 'seg' ? "Ej: 60" : formData.unidad_objetivo === 'min' ? "Ej: 15" : "Ej: 8"} 
            value={formData.reps_min} 
            onChange={(e) => handleChange('reps_min', e.target.value)} 
            colorTheme={inputTheme} 
            icon={formData.unidad_objetivo === 'seg' || formData.unidad_objetivo === 'min' ? <Clock className="w-5 h-5" /> : <Hash className="w-5 h-5" />} 
          />
          {formData.unidad_objetivo !== 'seg' && formData.unidad_objetivo !== 'min' && (
            <Input 
              type="number" 
              label={<span>Reps Máximas <span className="text-gray-400 font-normal">(Opcional)</span></span> as any} 
              placeholder="Ej: 12" 
              value={formData.reps_max} 
              onChange={(e) => handleChange('reps_max', e.target.value)} 
              colorTheme={inputTheme} 
              icon={<Hash className="w-5 h-5" />} 
            />
          )}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Unidad</label>
            <Select 
              value={formData.unidad_objetivo}
              onChange={(val) => {
                if (val === 'seg' || val === 'min') handleChange('reps_max', '');
                handleChange('unidad_objetivo', val);
              }}
              options={[ { value: 'reps', label: 'Repeticiones' }, { value: 'seg', label: 'Segundos' }, { value: 'min', label: 'Minutos' } ]}
              icon={<Target className="w-5 h-5" />} colorTheme={selectTheme}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input type="number" step="0.1" label={<span>Carga / Nivel <span className="text-gray-400 font-normal">(Opcional)</span></span> as any} placeholder="Ej: 60" value={formData.carga_actual} onChange={(e) => handleChange('carga_actual', e.target.value)} colorTheme={inputTheme} icon={<Hash className="w-5 h-5" />} />
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Tipo de Carga</label>
            <Select 
              value={formData.unidad_carga}
              onChange={(val) => handleChange('unidad_carga', val)}
              options={[ { value: 'kg', label: 'kg' }, { value: 'banda', label: 'banda (nivel)' }, { value: 'peso corporal', label: 'peso corporal' } ]}
              icon={<Scale className="w-5 h-5" />} colorTheme={selectTheme}
            />
          </div>
        </div>

      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel} colorTheme={{ focusRing: 'focus:ring-slate-400' }} className="flex-1 py-3">Cancelar</Button>
        <Button type="submit" disabled={isSubmitting || !formData.ejercicio_id || !formData.nombre} isLoading={isSubmitting} colorTheme={{ bgNormal: 'bg-indigo-600', bgHover: 'hover:bg-indigo-700', textColor: 'text-white', focusRing: 'focus:ring-indigo-500' }} className="flex-1 py-3 shadow-sm">
          {initialData ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
};