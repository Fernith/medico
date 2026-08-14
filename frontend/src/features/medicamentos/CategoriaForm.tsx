import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Tag } from 'lucide-react';

interface CategoriaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const COLORES = ['#14b8a6', '#0ea5e9', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#84cc16'];

export const CategoriaForm: React.FC<CategoriaFormProps> = ({ onSuccess, onCancel }) => {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/categorias-medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, color })
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
      
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-700 ml-1">Color de la categoría</label>
        <div className="flex flex-wrap gap-2 px-1">
          {COLORES.map(c => (
            <button
              key={c} type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !nombre.trim()} className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};