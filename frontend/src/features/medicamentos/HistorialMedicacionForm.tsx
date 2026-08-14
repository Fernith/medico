import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pill, Hash } from 'lucide-react';
import type { FormColorTheme } from '../peso/PesoForm';
import { type Medicamento } from './MedicamentoForm';

export interface HistorialMedicacion {
  id: string; medicamento_id: string; medicamento_nombre: string;
  formato: string; dosis_base: number; unidad_dosis: string;
  fecha_hora: string; cantidad_tomada: number; pendiente: boolean;
}

const defaultTheme: FormColorTheme = {
  submitBg: 'bg-teal-500', submitHover: 'hover:bg-teal-600', boxBg: 'bg-teal-50/50',
  boxBorder: 'border-teal-100', textTitle: 'text-teal-900', textSub: 'text-teal-600/80',
  checkboxActive: 'peer-checked:bg-orange-500', // Naranja para advertir de "Pendiente"
  inputTheme: { borderNormal: 'border-teal-200 hover:border-teal-300', borderFocus: 'focus:ring-teal-500 focus:border-teal-500', iconColor: 'text-teal-500' }
};

interface Props { initialData?: HistorialMedicacion | null; onSuccess: () => void; onCancel: () => void; colorTheme?: Partial<FormColorTheme>; }

const formatForInput = (dateStr?: string) => {
  if (!dateStr) return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return new Date(new Date(dateStr).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const HistorialMedicacionForm: React.FC<Props> = ({ initialData, onSuccess, onCancel, colorTheme = {} }) => {
  const theme = { ...defaultTheme, ...colorTheme };
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    medicamento_id: initialData?.medicamento_id || '',
    fecha_hora: formatForInput(initialData?.fecha_hora),
    cantidad_tomada: initialData?.cantidad_tomada?.toString() || '1',
    pendiente: initialData ? initialData.pendiente : false,
  });

  useEffect(() => { fetch('/api/medicamentos').then(r => r.json()).then(setMedicamentos).catch(console.error); }, []);

  const handleChange = (campo: string, valor: any) => setFormData(prev => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.medicamento_id || !formData.fecha_hora) return;
    setIsSubmitting(true);
    try {
      const payload = { ...formData, cantidad_tomada: parseFloat(formData.cantidad_tomada) || 1, fecha_hora: new Date(formData.fecha_hora).toISOString() };
      const url = initialData ? `/api/historial-medicacion/${initialData.id}` : '/api/historial-medicacion';
      const res = await fetch(url, { method: initialData ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'historial_medicacion' })); onSuccess(); }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const selectedMed = medicamentos.find(m => m.id === formData.medicamento_id);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-700 ml-1">Medicamento / Suplemento</label>
        <Select searchable value={formData.medicamento_id} onChange={(val) => handleChange('medicamento_id', val)} options={medicamentos.map(m => ({ value: m.id, label: `${m.nombre} (${m.dosis}${m.unidad_dosis})` }))} icon={<Pill className="w-5 h-5" />} colorTheme={{ borderActive: 'border-teal-400 ring-4 ring-teal-50', iconColor: 'text-teal-500', optionSelectedBg: 'bg-teal-50', optionSelectedText: 'text-teal-800' }} />
        {selectedMed && (
          <p className="text-xs font-bold text-teal-600 ml-1 mt-1">💡 Info: 1 {selectedMed.formato} equivale a {selectedMed.dosis} {selectedMed.unidad_dosis}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Fecha y Hora</label>
          <input type="datetime-local" value={formData.fecha_hora} onChange={(e) => handleChange('fecha_hora', e.target.value)} required className="w-full bg-white border border-teal-200 hover:border-teal-300 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium transition-colors" />
        </div>
        <Input type="number" step="0.1" label="Cantidad / Dosis" placeholder="Ej: 1" value={formData.cantidad_tomada} onChange={(e) => handleChange('cantidad_tomada', e.target.value)} colorTheme={theme.inputTheme} icon={<Hash className="w-5 h-5" />} />
      </div>

      <div className={`flex items-center justify-between p-4 border rounded-xl ${theme.boxBg} ${theme.boxBorder}`}>
        <div><p className={`font-semibold ${theme.textTitle}`}>Dejar como Pendiente</p><p className={`text-xs ${theme.textSub}`}>El registro se guardará pero constará como no tomado aún</p></div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={formData.pendiente} onChange={(e) => handleChange('pendiente', e.target.checked)} />
          <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${theme.checkboxActive}`}></div>
        </label>
      </div>

      <div className="flex gap-4">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !formData.medicamento_id} className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 ${theme.submitBg} ${theme.submitHover}`}>{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
};