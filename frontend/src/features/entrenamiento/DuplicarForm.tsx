import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Copy } from 'lucide-react';

interface DuplicarFormProps {
  initialName: string;
  onConfirm: (nuevoNombre: string) => Promise<void>;
  onCancel: () => void;
}

export const DuplicarForm: React.FC<DuplicarFormProps> = ({ initialName, onConfirm, onCancel }) => {
  const [nombre, setNombre] = useState(`Copia de ${initialName}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(nombre);
    } catch (err: any) {
      setError(err.message || "Error al duplicar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white flex flex-col space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Copy className="w-6 h-6" /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Duplicar</h2>
          <p className="text-sm text-slate-500 font-medium">Introduce un nombre para la copia.</p>
        </div>
      </div>
      
      <Input
        label="Nuevo Nombre"
        value={nombre}
        onChange={(e) => { setNombre(e.target.value); setError(null); }}
        required
        autoFocus
        colorTheme={{ borderNormal: 'border-slate-200', borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500', iconColor: 'text-indigo-500' }}
      />
      
      {error && <div className="text-sm font-bold text-rose-500 bg-rose-50 p-3 rounded-lg">{error}</div>}

      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !nombre.trim()} className="flex-[2] px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
          {isSubmitting ? 'Duplicando...' : 'Guardar Copia'}
        </button>
      </div>
    </form>
  );
};