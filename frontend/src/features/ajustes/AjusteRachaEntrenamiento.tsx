import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input'; 
import { useAjustes } from '../../context/AjustesContext';
import { Flame } from 'lucide-react';

export const AjusteRachaEntrenamiento: React.FC = () => {
  const { ajustes, actualizarAjuste } = useAjustes();
  const [diasStr, setDiasStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  useEffect(() => {
    setDiasStr(ajustes['racha_entrenamiento'] || '4');
  }, [ajustes]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensaje(null);
    try {
      await actualizarAjuste('racha_entrenamiento', diasStr);
      setMensaje({ tipo: 'exito', texto: 'Objetivo de racha guardado.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputTheme = { 
    borderNormal: 'border-slate-200', 
    borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500', 
    iconColor: 'text-indigo-500' 
  };

  return (
    <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 flex flex-col space-y-6 w-full">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <Flame className="w-6 h-6 text-indigo-500" /> Objetivo Semanal Racha
        </h2>
        <p className="text-sm text-slate-500">¿Cuántos días por semana (L-D) necesitas entrenar para mantener viva tu racha?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          type="number" label="Días por semana" value={diasStr} min="1" max="7"
          onChange={(e) => { setDiasStr(e.target.value); setMensaje(null); }}
          colorTheme={inputTheme}
        />
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-sm font-bold ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="flex justify-start pt-4 border-t border-indigo-50">
        <button type="submit" disabled={isSubmitting || !diasStr} className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-sm">
          Guardar Ajuste
        </button>
      </div>
    </form>
  );
};