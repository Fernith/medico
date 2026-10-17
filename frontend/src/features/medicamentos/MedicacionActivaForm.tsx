import React, { useState } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Select, type SelectColorTheme } from '../../components/ui/Select';
import { Button, type ButtonColorTheme } from '../../components/ui/Button';
import { Activity, Clock, Hash, FileText, Calendar } from 'lucide-react';
import { type Medicamento } from './MedicamentoForm';
import { apiFetch } from '../../api/client';

export interface MedicacionActiva {
  id: string;
  medicamento_id: string;
  medicamento_nombre: string;
  formato: string;
  unidad_dosis: string;
  frecuencia: string;
  cantidad: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  anotaciones?: string | null;
  activo: boolean;
}

interface MedicacionActivaFormProps {
  initialData?: MedicacionActiva | null;
  medicamentos: Medicamento[];
  onSuccess: () => void;
  onCancel: () => void;
}

const FRECUENCIAS = [
  { value: 'Segun necesidad', label: 'Según necesidad (Rescate / A demanda)' },
  { value: 'Cada 6 horas', label: 'Cada 6 horas' },
  { value: 'Cada 8 horas', label: 'Cada 8 horas' },
  { value: 'Cada 12 horas', label: 'Cada 12 horas' },
  { value: 'Diaria', label: 'Diaria' },
  { value: 'Semanal', label: 'Semanal' }
];

const formatForInput = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const tealInputTheme: InputColorTheme = {
  borderNormal: 'border-slate-200 hover:border-teal-300',
  borderFocus: 'focus:ring-teal-500 focus:border-teal-500',
  borderError: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  iconColor: 'text-teal-600',
  labelColor: 'text-slate-700 font-bold',
  helperTextColor: 'text-slate-500'
};

const tealSelectTheme: SelectColorTheme = {
  borderNormal: 'border-slate-200',
  borderActive: 'border-teal-500 ring-4 ring-teal-50',
  borderHover: 'hover:border-teal-300 hover:shadow-md',
  textSelected: 'text-teal-900',
  textPlaceholder: 'text-slate-400',
  iconColor: 'text-teal-600',
  dropdownBg: 'bg-white',
  dropdownBorder: 'border-teal-100',
  optionSelectedBg: 'bg-teal-50',
  optionSelectedText: 'text-teal-800',
  optionHoverBg: 'hover:bg-teal-50/50',
  optionHoverText: 'hover:text-teal-900',
  checkIcon: 'text-teal-600'
};

const tealButtonTheme: ButtonColorTheme = {
  bgNormal: 'bg-teal-600',
  bgHover: 'hover:bg-teal-700',
  textColor: 'text-white',
  border: 'border border-transparent',
  focusRing: 'focus:ring-teal-500'
};

const cancelButtonTheme: ButtonColorTheme = {
  bgNormal: 'bg-slate-100',
  bgHover: 'hover:bg-slate-200',
  textColor: 'text-slate-700',
  border: 'border border-slate-200',
  focusRing: 'focus:ring-slate-400'
};

export const MedicacionActivaForm: React.FC<MedicacionActivaFormProps> = ({
  initialData,
  medicamentos,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    medicamento_id: initialData?.medicamento_id || '',
    frecuencia: initialData?.frecuencia || 'Segun necesidad',
    cantidad: initialData?.cantidad?.toString() || '1',
    fecha_inicio: formatForInput(initialData?.fecha_inicio) || (initialData?.frecuencia === 'Segun necesidad' ? '' : formatForInput(new Date().toISOString())),
    fecha_fin: formatForInput(initialData?.fecha_fin) || '',
    anotaciones: initialData?.anotaciones || ''
  });

  const isSegunNecesidad = formData.frecuencia === 'Segun necesidad';

  const handleChange = (campo: string, valor: string) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleFrecuenciaChange = (valor: string) => {
    setFormData(prev => ({
      ...prev,
      frecuencia: valor,
      fecha_inicio: valor !== 'Segun necesidad' && !prev.fecha_inicio
        ? formatForInput(new Date().toISOString())
        : prev.fecha_inicio
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.medicamento_id) return;
    if (!isSegunNecesidad && !formData.fecha_inicio) return;

    setIsSubmitting(true);
    try {
      const payload = {
        medicamento_id: formData.medicamento_id,
        frecuencia: formData.frecuencia,
        cantidad: parseFloat(formData.cantidad) || 1,
        fecha_inicio: isSegunNecesidad ? null : (formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : null),
        fecha_fin: isSegunNecesidad ? null : (formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null),
        anotaciones: formData.anotaciones || null
      };

      const url = initialData ? `/api/medicaciones-activas/${initialData.id}` : '/api/medicaciones-activas';
      const res = await apiFetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicacion_activa' }));
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

  const isSubmitDisabled = isSubmitting || !formData.medicamento_id || (!isSegunNecesidad && !formData.fecha_inicio);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-700 ml-1">Medicamento / Suplemento</label>
        <Select
          searchable
          value={formData.medicamento_id}
          onChange={(val) => handleChange('medicamento_id', val)}
          options={medicamentos.map(m => ({ value: m.id, label: `${m.nombre} (${m.dosis}${m.unidad_dosis})` }))}
          icon={<Activity className="w-5 h-5" />}
          colorTheme={tealSelectTheme}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Frecuencia</label>
          <Select
            value={formData.frecuencia}
            onChange={(val) => handleFrecuenciaChange(val)}
            options={FRECUENCIAS}
            icon={<Clock className="w-5 h-5" />}
            colorTheme={tealSelectTheme}
          />
        </div>
        <Input
          type="number"
          step="0.1"
          label="Cantidad por toma"
          placeholder="Ej: 1"
          value={formData.cantidad}
          onChange={(e) => handleChange('cantidad', e.target.value)}
          colorTheme={tealInputTheme}
          icon={<Hash className="w-5 h-5" />}
        />
      </div>

      {!isSegunNecesidad && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="Inicio del Tratamiento"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
            colorTheme={tealInputTheme}
            icon={<Calendar className="w-5 h-5" />}
          />
          <Input
            type="datetime-local"
            label="Fin (Opcional)"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            colorTheme={tealInputTheme}
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>
      )}

      <Input
        label="Anotaciones para la toma"
        placeholder="Ej: Tomar solo en crisis respiratoria o dolor agudo"
        value={formData.anotaciones}
        onChange={(e) => handleChange('anotaciones', e.target.value)}
        colorTheme={tealInputTheme}
        icon={<FileText className="w-5 h-5" />}
      />

      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <Button
          type="button"
          onClick={onCancel}
          colorTheme={cancelButtonTheme}
          className="flex-1 py-3"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          isLoading={isSubmitting}
          colorTheme={tealButtonTheme}
          className="flex-1 py-3"
        >
          Guardar
        </Button>
      </div>
    </form>
  );
};