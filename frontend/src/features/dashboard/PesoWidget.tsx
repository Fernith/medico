import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { calcularIMC } from '../../utils/pesoCalculations';

export const PesoWidget = () => {
  const [ultimoPeso, setUltimoPeso] = useState<number | null>(null);
  
  useEffect(() => {
    fetch('/api/pesos')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Asumimos que viene ordenado por BBDD o lo forzamos
          const last = data.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
          setUltimoPeso(last.peso);
        }
      })
      .catch(console.error);
  }, []);

  const imc = ultimoPeso ? calcularIMC(ultimoPeso, 180) : null;

  const renderContent = () => {
    if (!ultimoPeso) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 font-medium">Sin datos</p>
          <p className="text-sm text-gray-400 mt-1">Registra tu peso</p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center mt-2 group-hover:scale-105 transition-transform">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Último peso:
        </span>
        <span className="text-5xl font-black text-emerald-900">
          {ultimoPeso} <span className="text-2xl">kg</span>
        </span>
        {imc && (
          <span className="text-xs text-emerald-500 font-medium text-center mt-2 px-2">
            IMC: {imc}
          </span>
        )}
      </div>
    );
  };

  return (
    <Link 
      to="/peso" 
      className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col h-full group"
    >
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors">Peso</h2>
        <svg className="w-5 h-5 text-gray-300 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {renderContent()}
    </Link>
  );
};