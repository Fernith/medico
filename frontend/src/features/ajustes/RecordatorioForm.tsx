import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { BellRing } from 'lucide-react';

export interface Recordatorio {
  clave: string;
  nombre: string;
  descripcion?: string;
  dias: number;
  entidad: string;
}

interface RecordatorioFormProps {
  initialData?: Recordatorio;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RecordatorioForm: React.FC<RecordatorioFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState<Recordatorio>({
    clave: '', nombre: '', descripcion: '', dias: 7, entidad: 'peso'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const url = isEditing ? `/api/recordatorios/${formData.clave}` : '/api/recordatorios';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dias: Number(formData.dias)
        })
      });

      if (!res.ok) throw new Error(await res.text());
      
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'recordatorio' }));
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el recordatorio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const entidadesOpciones = [
    { value: 'peso', label: 'Báscula (Peso)' },
    { value: 'medicion', label: 'Cinta Métrica (Medidas)' },
    { value: 'pasos', label: 'Actividad (Pasos)' },
    { value: 'sueno', label: 'Descanso (Sueño)' },
    { value: 'entrenamiento', label: 'Rutinas (Entrenamiento)' },
  ];

  const inputTheme = { borderNormal: 'border-slate-200', borderFocus: 'focus:border-indigo-500 focus:ring-indigo-500', iconColor: 'text-indigo-500' };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white flex flex-col space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BellRing className="w-6 h-6" /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}</h2>
          <p className="text-sm text-slate-500 font-medium">Configura cada cuántos días quieres que te avise.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Clave (ID Interno)" 
          value={formData.clave} 
          onChange={e => setFormData({ ...formData, clave: e.target.value })} 
          placeholder="ej: rec_peso" 
          required 
          disabled={isEditing} // BLOQUEADO AL EDITAR
          colorTheme={inputTheme}
        />
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700">Sección a vigilar</label>
          <Select 
            value={formData.entidad} 
            onChange={(val) => setFormData({ ...formData, entidad: val as string })} 
            options={entidadesOpciones} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <Input 
            label="Nombre Público" 
            value={formData.nombre} 
            onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
            placeholder="ej: Toca pesarse" 
            required 
            colorTheme={inputTheme}
          />
        </div>
        <Input 
          type="number" 
          label="Avisar a los (Días)" 
          value={formData.dias} 
          onChange={e => setFormData({ ...formData, dias: Number(e.target.value) })} 
          min="1" 
          required 
          colorTheme={inputTheme}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-700">Descripción / Mensaje</label>
        <textarea 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
          value={formData.descripcion || ''} 
          onChange={e => setFormData({ ...formData, descripcion: e.target.value })} 
          placeholder="Mensaje que saldrá en la alerta..."
        />
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="flex-[2] px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
          {isSubmitting ? 'Guardando...' : 'Guardar Recordatorio'}
        </button>
      </div>
    </form>
  );
};