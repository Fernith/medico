import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Hash, Scale, Clock, Dumbbell, Activity } from 'lucide-react';
import { type Ejercicio } from './EjercicioForm';

interface Equipamiento { id: string; nombre: string; }

export interface RealizacionEjercicio {
  id: string;
  ejercicio_id: string;
  ejercicio_nombre: string;
  ejercicio_imagen: string;
  equipamiento_id?: string;
  equipamiento_nombre?: string;
  carga_actual?: number | null;
  unidad_carga?: string;
  series?: number | null;
  reps_min?: number | null;
  reps_max?: number | null;
  descanso?: number | null;
}

interface RealizacionFormProps {
  initialData?: RealizacionEjercicio | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RealizacionForm: React.FC<RealizacionFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [equipos, setEquipos] = useState<Equipamiento[]>([]);

  const [formData, setFormData] = useState({
    ejercicio_id: initialData?.ejercicio_id || '',
    equipamiento_id: initialData?.equipamiento_id || null,
    carga_actual: initialData?.carga_actual?.toString() || '',
    unidad_carga: initialData?.unidad_carga || 'kg',
    series: initialData?.series?.toString() || '',
    reps_min: initialData?.reps_min?.toString() || '',
    reps_max: initialData?.reps_max?.toString() || '',
    descanso: initialData?.descanso?.toString() || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [resEj, resEq] = await Promise.all([ fetch('/api/ejercicios'), fetch('/api/equipamiento') ]);
      if (resEj.ok) setEjercicios(await resEj.json());
      if (resEq.ok) setEquipos(await resEq.json());
    };
    fetchData();
  }, []);

  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.ejercicio_id) { alert("Debes seleccionar un ejercicio"); return; }
    
    setIsSubmitting(true);
    try {
      const payload = {
        ejercicio_id: formData.ejercicio_id,
        equipamiento_id: formData.equipamiento_id || null,
        carga_actual: formData.carga_actual ? parseFloat(formData.carga_actual) : null,
        unidad_carga: formData.unidad_carga || null,
        series: formData.series ? parseInt(formData.series) : null,
        reps_min: formData.reps_min ? parseInt(formData.reps_min) : null,
        reps_max: formData.reps_max ? parseInt(formData.reps_max) : null,
        descanso: formData.descanso ? parseInt(formData.descanso) : null,
      };

      const url = initialData ? `/api/realizaciones/${initialData.id}` : '/api/realizaciones';
      const res = await fetch(url, {
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
        {/* Ejercicio Maestro */}
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Ejercicio a realizar</label>
          <Select 
            searchable
            value={formData.ejercicio_id}
            onChange={(val) => handleChange('ejercicio_id', val)}
            options={ejercicios.map(e => ({ value: e.id, label: e.nombre }))}
            icon={<Activity className="w-5 h-5" />}
            colorTheme={selectTheme}
          />
        </div>

        {/* Equipamiento Opcional */}
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Equipamiento (Opcional)</label>
          <Select 
            clearable
            placeholder="Ninguno / Peso Corporal"
            value={formData.equipamiento_id}
            onChange={(val) => handleChange('equipamiento_id', val)}
            options={equipos.map(e => ({ value: e.id, label: e.nombre }))}
            icon={<Dumbbell className="w-5 h-5" />}
            colorTheme={selectTheme}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input type="number" label="Series" placeholder="Ej: 4" value={formData.series} onChange={(e) => handleChange('series', e.target.value)} colorTheme={inputTheme} icon={<Hash className="w-5 h-5" />} />
          <Input type="number" label="Descanso (segundos)" placeholder="Ej: 90" value={formData.descanso} onChange={(e) => handleChange('descanso', e.target.value)} colorTheme={inputTheme} icon={<Clock className="w-5 h-5" />} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input type="number" label="Reps Mínimas" placeholder="Ej: 8" value={formData.reps_min} onChange={(e) => handleChange('reps_min', e.target.value)} colorTheme={inputTheme} icon={<Hash className="w-5 h-5" />} />
          <Input type="number" label="Reps Máximas" placeholder="Ej: 12" value={formData.reps_max} onChange={(e) => handleChange('reps_max', e.target.value)} colorTheme={inputTheme} icon={<Hash className="w-5 h-5" />} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input type="number" step="0.1" label="Carga" placeholder="Ej: 60" value={formData.carga_actual} onChange={(e) => handleChange('carga_actual', e.target.value)} colorTheme={inputTheme} icon={<Hash className="w-5 h-5" />} />
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Unidad</label>
            <Select 
              value={formData.unidad_carga}
              onChange={(val) => handleChange('unidad_carga', val)}
              options={[ { value: 'kg', label: 'kg' }, { value: 'banda', label: 'banda (nivel)' }, { value: 'segundos', label: 'segundos (isométrico)' }, { value: 'peso corporal', label: 'peso corporal' } ]}
              icon={<Scale className="w-5 h-5" />} colorTheme={selectTheme}
            />
          </div>
        </div>

      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !formData.ejercicio_id} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  );
};