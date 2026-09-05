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
  proxima_fecha?: string | null;
}

interface RecordatorioFormProps {
  initialData?: Recordatorio;
  onSuccess: () => void;
  onCancel: () => void;
}

// Función auxiliar para obtener YYYY-MM-DD en hora local segura
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const RecordatorioForm: React.FC<RecordatorioFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState<Recordatorio>({
    clave: '', nombre: '', descripcion: '', dias: 7, entidad: 'fecha', proxima_fecha: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Límite mínimo: Hoy (Así bloqueamos fechas anteriores siempre)
  const hoyStr = getLocalDateString(new Date());

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validación estricta tanto al crear como al editar
    if (formData.entidad === 'fecha') {
      if (!formData.proxima_fecha) {
        setError("Debes seleccionar una fecha de inicio.");
        setIsSubmitting(false);
        return;
      }
      if (formData.proxima_fecha < hoyStr) {
        setError("La fecha no puede ser anterior al día de hoy.");
        setIsSubmitting(false);
        return;
      }
    }

    const url = isEditing ? `/api/recordatorios/${formData.clave}` : '/api/recordatorios';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dias: Number(formData.dias),
          proxima_fecha: formData.entidad === 'fecha' ? formData.proxima_fecha : null
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
    { value: 'fecha', label: 'Seleccionar fecha (Manual)' },
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
          <p className="text-sm text-slate-500 font-medium">Configura tus alertas dinámicas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Clave (ID Interno)" 
          value={formData.clave} 
          onChange={e => setFormData({ ...formData, clave: e.target.value })} 
          placeholder="ej: rec_agua" 
          required 
          disabled={isEditing} 
          colorTheme={inputTheme}
        />
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700">Sección a vigilar</label>
          <Select 
            value={formData.entidad} 
            onChange={(val) => setFormData({ ...formData, entidad: val as string })} 
            options={entidadesOpciones}
            disabled={isEditing} // BLOQUEADO AL EDITAR
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <Input 
            label="Nombre Público" 
            value={formData.nombre} 
            onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
            placeholder="ej: Revisión médica" 
            required 
            colorTheme={inputTheme}
          />
        </div>
        <Input 
          type="number" 
          label="Avisar cada (Días)" 
          value={formData.dias} 
          onChange={e => setFormData({ ...formData, dias: Number(e.target.value) })} 
          min="1" 
          required 
          colorTheme={inputTheme}
        />
      </div>

      {/* RENDER CONDICIONAL SI ES POR FECHA */}
      {formData.entidad === 'fecha' && (
        <div className="w-full sm:w-1/2">
          <Input 
            type="date"
            label="Próximo Aviso" 
            value={formData.proxima_fecha || ''} 
            onChange={e => setFormData({ ...formData, proxima_fecha: e.target.value })} 
            min={hoyStr} // BLOQUEA FECHAS ANTERIORES SIEMPRE (CREAR Y EDITAR)
            required 
            colorTheme={inputTheme}
          />
        </div>
      )}

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