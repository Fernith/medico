import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Tag } from 'lucide-react';

interface CategoriaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CategoriaForm: React.FC<CategoriaFormProps> = ({ onSuccess, onCancel }) => {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/categorias-medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'categoria_medicamento' }));
        onSuccess();
      } else alert(`Error: ${await res.text()}`);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const inputTheme = { borderNormal: 'border-slate-200', borderFocus: 'focus:ring-teal-500 focus:border-teal-500', iconColor: 'text-teal-500' };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <Input label="Nombre de la Categoría" placeholder="Ej: Analgésicos, Vitaminas..." value={nombre} onChange={(e) => setNombre(e.target.value)} colorTheme={inputTheme} icon={<Tag className="w-5 h-5" />} />
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !nombre.trim()} className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};