import { useEffect, useState } from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RachaWidget = () => {
  const [racha, setRacha] = useState<{ dias: number, inicio: string } | null>(null);

  useEffect(() => {
    const fetchRacha = () => {
      fetch('/api/rutinas/racha')
        .then(res => res.json())
        .then(setRacha)
        .catch(console.error);
    };
    
    // Carga inicial
    fetchRacha();

    // 3. Auto-recarga al guardar un entrenamiento
    const handleRegistro = (e: any) => {
      // En 'useEntrenamiento.ts' se emite 'historial' al acabar
      if (e.detail === 'historial') {
        fetchRacha();
      }
    };
    
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const renderContent = () => {
    if (!racha) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 font-medium">Sin datos</p>
          <p className="text-sm text-gray-400 mt-1">Registra un entreno</p>
        </div>
      );
    }

    const dateStr = new Date(racha.inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    return (
      <div className="flex-1 flex flex-col items-center justify-center mt-2 group-hover:scale-105 transition-transform">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Racha actual:
        </span>
        
        <div className="flex items-center justify-center gap-1">
          {/* Llama de fuego solo si hay más de 1 día de racha */}
          {racha.dias > 1 && (
            <Flame className="w-10 h-10 text-orange-500 animate-pulse drop-shadow-sm" fill="currentColor" />
          )}
          <span className="text-5xl font-black text-indigo-900">
            {racha.dias} <span className="text-2xl">días</span>
          </span>
        </div>

        <span className="text-xs text-indigo-500 font-medium text-center mt-2 px-2">
          Desde el {dateStr}
        </span>
      </div>
    );
  };

  return (
    <Link 
      to="/entrenamiento" 
      className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col h-full group"
    >
      <div className="flex items-center gap-2 mb-2">
        {/* 4. Colores de título en Indigo */}
        <h2 className="text-xl font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">
          Entrenamiento
        </h2>
        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" strokeWidth={3} />
      </div>

      {renderContent()}
    </Link>
  );
};