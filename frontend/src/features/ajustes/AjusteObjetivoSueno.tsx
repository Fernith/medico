import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input'; 
import { useAjustes } from '../../context/AjustesContext';

export const AjusteObjetivoSueno: React.FC = () => {
  const { ajustes, actualizarAjuste } = useAjustes();
  const [horas, setHoras] = useState<number | ''>('');
  const [deuda, setDeuda] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  useEffect(() => {
    setHoras(Number(ajustes['objetivo_horas_sueno']) || 8);
    setDeuda(Number(ajustes['limite_deuda_sueno']) || 5);
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
    
    const horasFinal = horas === '' ? 8 : horas;
    const deudaFinal = deuda === '' ? 5 : deuda;
    
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
          Define tus horas ideales y el límite máximo de horas que te permites perder antes de entrar en riesgo fisiológico.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          type="number" 
          label="Horas objetivo por noche"
          value={horas} 
          onChange={(e) => {
            setHoras(e.target.value === '' ? '' : Number(e.target.value));
            setMensaje(null);
          }}
          min={3} max={15}
        />
        <Input 
          type="number" 
          label="Límite Deuda de Sueño (h)"
          value={deuda} 
          onChange={(e) => {
            setDeuda(e.target.value === '' ? '' : Number(e.target.value));
            setMensaje(null);
          }}
          min={0} max={30}
        />
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-sm font-bold ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="border-indigo-50 sm:col-span-1">
        <button 
          type="submit" 
          disabled={isSubmitting || horas === '' || deuda === ''}
          className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Ajustes'}
        </button>
      </div>
    </form>
  );
};