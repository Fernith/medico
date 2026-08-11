import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Activity, Clock, Hash, FileText } from 'lucide-react';
import { type Medicamento } from './MedicamentoForm';

export interface MedicacionActiva {
  id: string; medicamento_id: string; medicamento_nombre: string;
  formato: string; unidad_dosis: string; frecuencia: string; cantidad: number;
  fecha_inicio: string; fecha_fin?: string | null; anotaciones?: string | null; activo: boolean;
}

interface MedicacionActivaFormProps { initialData?: MedicacionActiva | null; medicamentos: Medicamento[]; onSuccess: () => void; onCancel: () => void; }

const FRECUENCIAS = ['Cada 6 horas', 'Cada 8 horas', 'Cada 12 horas', 'Diaria', 'Semanal'];

const formatForInput = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const MedicacionActivaForm: React.FC<MedicacionActivaFormProps> = ({ initialData, medicamentos, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    medicamento_id: initialData?.medicamento_id || '',
    frecuencia: initialData?.frecuencia || 'Diaria',
    cantidad: initialData?.cantidad?.toString() || '1',
    fecha_inicio: formatForInput(initialData?.fecha_inicio) || formatForInput(new Date().toISOString()),
    fecha_fin: formatForInput(initialData?.fecha_fin) || '',
    anotaciones: initialData?.anotaciones || ''
  });

  const handleChange = (campo: string, valor: any) => setFormData(prev => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.medicamento_id || !formData.fecha_inicio) return;
    setIsSubmitting(true);
    try {
      const payload = {
        medicamento_id: formData.medicamento_id,
        frecuencia: formData.frecuencia,
        cantidad: parseFloat(formData.cantidad),
        fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
        fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null,
        anotaciones: formData.anotaciones || null
      };
      const url = initialData ? `/api/medicaciones-activas/${initialData.id}` : '/api/medicaciones-activas';
      const res = await fetch(url, { method: initialData ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicacion_activa' }));
        onSuccess();
      } else alert(`Error: ${await res.text()}`);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const inputTheme = { borderNormal: 'border-slate-200', borderFocus: 'focus:ring-teal-500 focus:border-teal-500', iconColor: 'text-teal-500' };
  const selectTheme = { borderNormal: 'border-slate-200', borderActive: 'border-teal-400 ring-4 ring-teal-50', iconColor: 'text-teal-500', optionSelectedBg: 'bg-teal-50', optionSelectedText: 'text-teal-800' };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-700 ml-1">Medicamento / Suplemento</label>
        <Select searchable value={formData.medicamento_id} onChange={(val) => handleChange('medicamento_id', val)} options={medicamentos.map(m => ({ value: m.id, label: `${m.nombre} (${m.dosis}${m.unidad_dosis})` }))} icon={<Activity className="w-5 h-5" />} colorTheme={selectTheme} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Frecuencia</label>
          <Select value={formData.frecuencia} onChange={(val) => handleChange('frecuencia', val)} options={FRECUENCIAS.map(f => ({ value: f, label: f }))} icon={<Clock className="w-5 h-5" />} colorTheme={selectTheme} />
        </div>
        <Input type="number" step="0.1" label="Cantidad por toma" placeholder="Ej: 1" value={formData.cantidad} onChange={(e) => handleChange('cantidad', e.target.value)} colorTheme={inputTheme} icon={<Hash className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Inicio del Tratamiento</label>
          <input type="datetime-local" value={formData.fecha_inicio} onChange={(e) => handleChange('fecha_inicio', e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Fin (Dejar vacío si es crónico)</label>
          <input type="datetime-local" value={formData.fecha_fin} onChange={(e) => handleChange('fecha_fin', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium" />
        </div>
      </div>
      <Input label="Anotaciones para la toma" placeholder="Ej: Tomar con mucha agua" value={formData.anotaciones} onChange={(e) => handleChange('anotaciones', e.target.value)} colorTheme={inputTheme} icon={<FileText className="w-5 h-5" />} />
      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !formData.medicamento_id} className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
};