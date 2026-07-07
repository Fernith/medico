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

  return (
    <Link 
      to="/peso" 
      className="bg-white p-5 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col h-full group"
    >
      <div className="flex justify-between items-start w-full">
        <h2 className="text-base font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">Peso</h2>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mt-2 group-hover:scale-105 transition-transform">
        {ultimoPeso ? (
          <>
            <span className="text-4xl font-black text-emerald-600">
              {ultimoPeso} <span className="text-xl">kg</span>
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1">
              IMC: {imc}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-400 font-medium">Sin datos</span>
        )}
      </div>
    </Link>
  );
};