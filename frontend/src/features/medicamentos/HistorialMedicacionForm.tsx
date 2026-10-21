import React, { useState, useEffect, useMemo } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Select, type SelectColorTheme } from '../../components/ui/Select';
import { Button, type ButtonColorTheme } from '../../components/ui/Button';
import { Pill, Hash, Calendar, Sparkles } from 'lucide-react';
import { type Medicamento } from './MedicamentoForm';
import { type MedicacionActiva } from './MedicacionActivaForm';
import { apiFetch } from '../../api/client';

export interface HistorialMedicacion {
  id: string;
  medicamento_id: string;
  medicamento_nombre: string;
  categoria_nombre?: string;
  categoria_color?: string;
  formato: string;
  dosis_base: number;
  unidad_dosis: string;
  fecha_hora: string;
  cantidad_tomada: number;
  pendiente: boolean;
}

const tealInputTheme: InputColorTheme = {
  borderNormal: 'border-teal-200 hover:border-teal-300',
  borderFocus: 'focus:ring-teal-500 focus:border-teal-500',
  borderError: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  iconColor: 'text-teal-600',
  labelColor: 'text-teal-900 font-bold',
  helperTextColor: 'text-teal-600 font-medium'
};

const tealSelectTheme: SelectColorTheme = {
  borderNormal: 'border-teal-200',
  borderActive: 'border-teal-500 ring-4 ring-teal-50',
  borderHover: 'hover:border-teal-300 hover:shadow-md',
  textSelected: 'text-teal-900',
  textPlaceholder: 'text-slate-400',
  iconColor: 'text-teal-600',
  dropdownBg: 'bg-white',
  dropdownBorder: 'border-teal-200',
  optionSelectedBg: 'bg-teal-50',
  optionSelectedText: 'text-teal-800',
  optionHoverBg: 'hover:bg-teal-50/50',
  optionHoverText: 'hover:text-teal-900',
  checkIcon: 'text-teal-600'
};

const tealButtonPrimaryTheme: ButtonColorTheme = {
  bgNormal: 'bg-teal-600',
  bgHover: 'hover:bg-teal-700',
  textColor: 'text-white font-bold',
  border: 'border border-teal-600',
  focusRing: 'focus:ring-teal-500'
};

const tealButtonCancelTheme: ButtonColorTheme = {
  bgNormal: 'bg-teal-50',
  bgHover: 'hover:bg-teal-100',
  textColor: 'text-teal-800 font-bold',
  border: 'border border-teal-200',
  focusRing: 'focus:ring-teal-400'
};

const tealChipActiveTheme: ButtonColorTheme = {
  bgNormal: 'bg-teal-600',
  bgHover: 'hover:bg-teal-700',
  textColor: 'text-white font-bold',
  border: 'border border-teal-600 shadow-sm',
  focusRing: 'focus:ring-teal-500'
};

const tealChipInactiveTheme: ButtonColorTheme = {
  bgNormal: 'bg-teal-50/70',
  bgHover: 'hover:bg-teal-100',
  textColor: 'text-teal-800 font-bold',
  border: 'border border-teal-200',
  focusRing: 'focus:ring-teal-400'
};

interface Props {
  initialData?: HistorialMedicacion | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const formatForInput = (dateStr?: string) => {
  if (!dateStr) return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return new Date(new Date(dateStr).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const HistorialMedicacionForm: React.FC<Props> = ({ initialData, onSuccess, onCancel }) => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medicacionesActivas, setMedicacionesActivas] = useState<MedicacionActiva[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    medicamento_id: initialData?.medicamento_id || '',
    fecha_hora: formatForInput(initialData?.fecha_hora),
    cantidad_tomada: initialData?.cantidad_tomada?.toString() || '1',
    pendiente: initialData ? initialData.pendiente : false,
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/api/medicamentos').then(r => r.ok ? r.json() : []),
      apiFetch('/api/medicaciones-activas').then(r => r.ok ? r.json() : [])
    ])
      .then(([meds, acts]: [Medicamento[], MedicacionActiva[]]) => {
        setMedicamentos(meds);
        setMedicacionesActivas(acts);
      })
      .catch(console.error);
  }, []);

  const medicacionesSegunNecesidad = useMemo(() => {
    return medicacionesActivas.filter(
      act => act.activo && act.frecuencia === 'Segun necesidad'
    );
  }, [medicacionesActivas]);

  const handleChange = (campo: string, valor: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSeleccionarSegunNecesidad = (act: MedicacionActiva) => {
    setFormData(prev => ({
      ...prev,
      medicamento_id: act.medicamento_id,
      cantidad_tomada: act.cantidad.toString()
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.medicamento_id || !formData.fecha_hora) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        cantidad_tomada: parseFloat(formData.cantidad_tomada) || 1,
        fecha_hora: new Date(formData.fecha_hora).toISOString()
      };
      const url = initialData ? `/api/historial-medicacion/${initialData.id}` : '/api/historial-medicacion';
      const res = await apiFetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'historial_medicacion' }));
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMed = medicamentos.find(m => m.id === formData.medicamento_id);
  const activaSeleccionada = medicacionesSegunNecesidad.find(act => act.medicamento_id === formData.medicamento_id);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      {!initialData && medicacionesSegunNecesidad.length > 0 && (
        <div className="p-3.5 bg-teal-50/40 border border-teal-200 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Toma rápida (Según necesidad)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {medicacionesSegunNecesidad.map(act => {
              const isSelected = formData.medicamento_id === act.medicamento_id;
              return (
                <Button
                  key={act.id}
                  type="button"
                  size="sm"
                  colorTheme={isSelected ? tealChipActiveTheme : tealChipInactiveTheme}
                  onClick={() => handleSeleccionarSegunNecesidad(act)}
                  icon={<Pill className="w-4 h-4" />}
                >
                  <span>{act.medicamento_nombre}</span>
                  <span className="text-xs opacity-90">({act.cantidad} {act.formato})</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Select
          searchable
          label="Medicamento / Suplemento"
          value={formData.medicamento_id}
          onChange={(val) => handleChange('medicamento_id', val)}
          options={medicamentos.map(m => ({ value: m.id, label: `${m.nombre} (${m.dosis}${m.unidad_dosis})` }))}
          icon={<Pill className="w-5 h-5" />}
          colorTheme={tealSelectTheme}
        />
        {selectedMed && (
          <p className="text-xs font-bold text-teal-600 ml-1 mt-1">
            💡 Info: 1 {selectedMed.formato} equivale a {selectedMed.dosis} {selectedMed.unidad_dosis}
          </p>
        )}
        {activaSeleccionada?.anotaciones && (
          <p className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 p-2.5 rounded-xl ml-1 mt-2">
            📋 Pauta activa: {activaSeleccionada.anotaciones}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="datetime-local"
          label="Fecha y Hora"
          value={formData.fecha_hora}
          onChange={(e) => handleChange('fecha_hora', e.target.value)}
          required
          colorTheme={tealInputTheme}
          icon={<Calendar className="w-5 h-5" />}
        />
        <Input
          type="number"
          step="0.1"
          label="Cantidad / Dosis"
          placeholder="Ej: 1"
          value={formData.cantidad_tomada}
          onChange={(e) => handleChange('cantidad_tomada', e.target.value)}
          colorTheme={tealInputTheme}
          icon={<Hash className="w-5 h-5" />}
        />
      </div>

      <div className="flex items-center justify-between p-4 border border-teal-200 rounded-xl bg-teal-50/50">
        <div>
          <p className="font-semibold text-teal-900">Dejar como Pendiente</p>
          <p className="text-xs text-teal-700/80">El registro se guardará pero constará como no tomado aún</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={formData.pendiente}
            onChange={(e) => handleChange('pendiente', e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-teal-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </label>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          size="lg"
          colorTheme={tealButtonCancelTheme}
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="lg"
          colorTheme={tealButtonPrimaryTheme}
          isLoading={isSubmitting}
          disabled={isSubmitting || !formData.medicamento_id}
          className="flex-1"
        >
          Guardar
        </Button>
      </div>
    </form>
  );
};

