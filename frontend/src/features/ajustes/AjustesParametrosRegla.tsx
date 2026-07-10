import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input'; 
import { useAjustes } from '../../context/AjustesContext';

interface AjustesParametrosReglaProps {
  isVisible: boolean;
}

export const AjustesParametrosRegla: React.FC<AjustesParametrosReglaProps> = ({ isVisible }) => {
  const { ajustes, actualizarAjuste } = useAjustes();
  
  const [ciclo, setCiclo] = useState<number | ''>('');
  const [periodo, setPeriodo] = useState<number | ''>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  useEffect(() => {
    setCiclo(Number(ajustes['duracion_media_ciclo']) || 28);
    setPeriodo(Number(ajustes['duracion_media_periodo']) || 6);
  }, [ajustes]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  if (!isVisible) return null;

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensaje(null);
    
    const cicloFinal = ciclo === '' ? 28 : ciclo;
    const periodoFinal = periodo === '' ? 6 : periodo;
    
    try {
      await actualizarAjuste('duracion_media_ciclo', cicloFinal.toString());
      await actualizarAjuste('duracion_media_periodo', periodoFinal.toString());
      setMensaje({ tipo: 'exito', texto: 'Parámetros actualizados correctamente.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Ocurrió un error al guardar los parámetros.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-pink-100 flex flex-col space-y-8 w-full">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-pink-700 flex items-center gap-2">
          <span className="text-pink-500">🩸</span> Parámetros del Ciclo Menstrual
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          type="number" 
          label="Duración media del ciclo (días)"
          value={ciclo} 
          onChange={(e) => {
            setCiclo(e.target.value === '' ? '' : Number(e.target.value));
            setMensaje(null);
          }}
          clearable
          onClear={() => { setCiclo(''); setMensaje(null); }}
          min={15}
          max={60}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
          colorTheme={{
            borderNormal: 'border-pink-200 hover:border-pink-300',
            borderFocus: 'focus:ring-pink-500 focus:border-pink-500',
            iconColor: 'text-pink-500',
            labelColor: 'text-gray-700'
          }}
        />
        
        <Input 
          type="number" 
          label="Duración media del periodo (días)"
          value={periodo} 
          onChange={(e) => {
            setPeriodo(e.target.value === '' ? '' : Number(e.target.value));
            setMensaje(null);
          }}
          clearable
          onClear={() => { setPeriodo(''); setMensaje(null); }}
          min={1}
          max={15}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
          colorTheme={{
            borderNormal: 'border-pink-200 hover:border-pink-300',
            borderFocus: 'focus:ring-pink-500 focus:border-pink-500',
            iconColor: 'text-pink-500',
            labelColor: 'text-gray-700'
          }}
        />
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-sm font-bold ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-pink-50">
        <button 
          type="submit" 
          disabled={isSubmitting || ciclo === '' || periodo === ''}
          className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 flex justify-center items-center shadow-sm hover:shadow-pink-500/30"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Parámetros'}
        </button>
      </div>
    </form>
  );
};