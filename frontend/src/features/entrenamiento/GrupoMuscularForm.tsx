import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Type, Layers } from 'lucide-react';

export interface GrupoMuscular {
  id: string;
  nombre: string;
  categoria: string;
}

interface GrupoMuscularFormProps {
  initialData?: GrupoMuscular | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const GrupoMuscularForm: React.FC<GrupoMuscularFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    categoria: initialData?.categoria || 'Upper Body',
  });

  const handleChange = (campo: string, valor: string) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;
    
    setIsSubmitting(true);
    try {
      const url = initialData ? `/api/grupos-musculares/${initialData.id}` : '/api/grupos-musculares';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'grupo_muscular' }));
        onSuccess();
      } else {
        alert(`Error: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputTheme = {
    borderNormal: 'border-slate-200 hover:border-indigo-300',
    borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500',
    iconColor: 'text-indigo-500',
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div className="space-y-4">
        <Input
          type="text" label="Nombre del Grupo Muscular" placeholder="Ej: Pectoral Mayor"
          value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} 
          required colorTheme={inputTheme} icon={<Type className="w-5 h-5" />}
        />

        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Categoría Corporal</label>
          <Select 
            value={formData.categoria}
            onChange={(val) => handleChange('categoria', val)}
            className="w-full"
            options={[
              { value: 'Upper Body', label: 'Upper Body (Tren Superior)' },
              { value: 'Lower Body', label: 'Lower Body (Tren Inferior)' },
              { value: 'Core', label: 'Core (Zona Media)' },
              { value: 'Full Body', label: 'Full Body (Cuerpo Entero)' }
            ]}
            icon={<Layers className="w-5 h-5" />}
            colorTheme={{
              borderNormal: 'border-slate-200', borderActive: 'border-indigo-400 ring-4 ring-indigo-50',
              borderHover: 'hover:border-indigo-300 hover:shadow-sm', textSelected: 'text-slate-700',
              iconColor: 'text-indigo-500', optionSelectedBg: 'bg-indigo-50', optionSelectedText: 'text-indigo-800',
              optionHoverBg: 'hover:bg-slate-50', optionHoverText: 'hover:text-slate-800', checkIcon: 'text-indigo-500'
            }}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting || !formData.nombre} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  );
};