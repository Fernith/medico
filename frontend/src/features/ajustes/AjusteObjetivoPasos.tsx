import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input'; 
import { useAjustes } from '../../context/AjustesContext';
import { Footprints } from 'lucide-react';

export const AjusteObjetivoPasos: React.FC = () => {
  const { ajustes, actualizarAjuste } = useAjustes();
  const [pasosStr, setPasosStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  useEffect(() => {
    setPasosStr(ajustes['objetivo_pasos_diarios'] || '8000');
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
      await actualizarAjuste('objetivo_pasos_diarios', pasosStr);
      setMensaje({ tipo: 'exito', texto: 'Objetivo de pasos guardado.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar el ajuste.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputTheme = { 
    borderNormal: 'border-slate-200', 
    borderFocus: 'focus:ring-orange-500 focus:border-orange-500', 
    iconColor: 'text-orange-500' 
  };

  return (
    <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 flex flex-col space-y-6 w-full">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-orange-900 flex items-center gap-2">
          <Footprints className="w-6 h-6 text-orange-500" /> Objetivo de Pasos
        </h2>
        <p className="text-sm text-slate-500">Define tu meta diaria de pasos para las gráficas y estadísticas.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          type="number" 
          label="Pasos diarios"
          value={pasosStr} 
          min="1000"
          step="500"
          onChange={(e) => { setPasosStr(e.target.value); setMensaje(null); }}
          colorTheme={inputTheme}
        />
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-sm font-bold ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="flex justify-start pt-4 border-t border-orange-50">
        <button type="submit" disabled={isSubmitting || !pasosStr} className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-sm">
          {isSubmitting ? 'Guardando...' : 'Guardar Ajuste'}
        </button>
      </div>
    </form>
  );
};