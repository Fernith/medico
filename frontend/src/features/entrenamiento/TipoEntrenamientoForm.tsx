import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Type } from 'lucide-react';

interface TipoEntrenamientoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TipoEntrenamientoForm: React.FC<TipoEntrenamientoFormProps> = ({ onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nombre, setNombre] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!nombre) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tipos-entrenamiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'tipo_entrenamiento' }));
        onSuccess();
      } else {
        alert(`Error: ${await res.text()}`);
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const inputTheme = { borderNormal: 'border-slate-200 hover:border-indigo-300', borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500', iconColor: 'text-indigo-500' };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <Input type="text" label="Tipo de Entrenamiento" placeholder="Ej: Fuerza, Hipertrofia, Cardio..." value={nombre} onChange={(e) => setNombre(e.target.value)} required colorTheme={inputTheme} icon={<Type className="w-5 h-5" />} />
      <div className="flex gap-4 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !nombre} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};