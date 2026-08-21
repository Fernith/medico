import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input'; 
import { useAjustes } from '../../context/AjustesContext';
import { decimalToTimeStr, timeStrToDecimal } from '../../utils/suenoCalculations';

export const AjusteObjetivoSueno: React.FC = () => {
  const { ajustes, actualizarAjuste } = useAjustes();
  
  // El input type="time" trabaja siempre con strings "HH:mm"
  const [horasStr, setHorasStr] = useState<string>('');
  const [deudaStr, setDeudaStr] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  useEffect(() => {
    // Al cargar la BD, convertimos el 7.5 a "07:30"
    setHorasStr(decimalToTimeStr(ajustes['objetivo_horas_sueno'], '08:00'));
    setDeudaStr(decimalToTimeStr(ajustes['limite_deuda_sueno'], '05:00'));
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
    
    // Al guardar, convertimos el "07:30" a 7.5 (float) para la BD
    const horasFinal = timeStrToDecimal(horasStr);
    const deudaFinal = timeStrToDecimal(deudaStr);
    
    try {
      await actualizarAjuste('objetivo_horas_sueno', horasFinal.toString());
      await actualizarAjuste('limite_deuda_sueno', deudaFinal.toString());
      setMensaje({ tipo: 'exito', texto: 'Ajustes de sueño guardados.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar el ajuste.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 flex flex-col space-y-6 w-full">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <span className="text-indigo-500">🌙</span> Objetivo y Deuda de Sueño
        </h2>
        <p className="text-sm text-slate-500">
          Define tus horas ideales y el límite máximo de tiempo que te permites perder antes de entrar en riesgo fisiológico.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          type="time" 
          label="Objetivo por noche (HH:mm)"
          value={horasStr} 
          onChange={(e) => {
            setHorasStr(e.target.value);
            setMensaje(null);
          }}
        />
        <Input 
          type="time" 
          label="Límite Deuda de Sueño (HH:mm)"
          value={deudaStr} 
          onChange={(e) => {
            setDeudaStr(e.target.value);
            setMensaje(null);
          }}
        />
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-sm font-bold ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="flex justify-start pt-4 border-t border-indigo-50">
        <button 
          type="submit" 
          disabled={isSubmitting || !horasStr || !deudaStr}
          className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Ajustes'}
        </button>
      </div>
    </form>
  );
};