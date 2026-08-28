import { ChevronRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export interface CicloFalso {
  id?: string | number;
  fecha_inicio: string;
  fecha_fin?: string | null;
}

interface ReglaWidgetProps {
  ultimoCiclo?: CicloFalso | null;
  mediaCiclo: number;
  mediaPeriodo: number;
}

export const ReglaWidget: React.FC<ReglaWidgetProps> = ({ ultimoCiclo, mediaCiclo, mediaPeriodo }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (str: string) => {
    const [y, m, d] = str.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const renderContent = () => {
    if (!ultimoCiclo) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 font-medium">Sin datos</p>
          <p className="text-sm text-gray-400 mt-1">Registra tu ciclo</p>
        </div>
      );
    }

    const inicio = parseDate(ultimoCiclo.fecha_inicio);
    const isEnPeriodo = !ultimoCiclo.fecha_fin;

    const diffTime = today.getTime() - inicio.getTime();
    const diasDesdeInicio = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // ESTADO 1: En el periodo (Círculo Rosa GRANDE)
    if (isEnPeriodo) {
      const diasRestantes = mediaPeriodo - diasDesdeInicio;
      let textoInferior = `Quedan ${diasRestantes} días`;
      if (diasRestantes === 0) textoInferior = 'Último día';
      if (diasRestantes < 0) textoInferior = '¿Sigue tu periodo?';

      return (
        <div className="flex-1 flex flex-col items-center justify-center mt-2">
          {/* Restaurado el tamaño original w-48 h-48 */}
          <div className="w-48 h-48 rounded-full border-4 border-pink-100 bg-pink-50 flex flex-col items-center justify-center shadow-inner p-4 transition-transform group-hover:scale-105 duration-300">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">
              Periodo:
            </span>
            <span className="text-4xl font-black text-pink-600 my-1">
              Día {diasDesdeInicio}
            </span>
            <span className="text-xs text-pink-500 font-medium text-center mt-2 px-2">
              {textoInferior}
            </span>
          </div>
        </div>
      );
    }

    const fechaSiguiente = new Date(inicio);
    fechaSiguiente.setDate(fechaSiguiente.getDate() + mediaCiclo);
    const diffSiguiente = Math.ceil((fechaSiguiente.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // ESTADO 2: Fase de espera (Texto GRANDE)
    if (diffSiguiente > 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center mt-2 group-hover:scale-105 transition-transform">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Periodo en:
          </span>
          <span className="text-5xl font-black text-purple-900">
            {diffSiguiente} <span className="text-2xl">{diffSiguiente === 1 ? 'día' : 'días'}</span>
          </span>
        </div>
      );
    }

    // ESTADO 3: Retraso / Hoy (Caja GRANDE)
    const diasRetraso = Math.abs(diffSiguiente);

    return (
      <div className="flex-1 flex flex-col items-center justify-center mt-2">
        <div className="px-8 py-8 w-full rounded-[2rem] bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            {diasRetraso === 0 ? 'Esperado para:' : 'Retraso de:'}
          </span>
          <span className="text-4xl font-black text-slate-700 mt-1">
            {diasRetraso === 0 ? 'Hoy' : `${diasRetraso} ${diasRetraso === 1 ? 'día' : 'días'}`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Link 
      to="/regla" 
      className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col h-full group"
    >
      <div className="flex items-center gap-2 mb-2">
        {/* Título restaurado a text-xl */}
        <h2 className="text-xl font-bold text-purple-900 group-hover:text-pink-600 transition-colors">Regla</h2>
        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-pink-400 transition-colors" strokeWidth={3} />
      </div>
      
      {renderContent()}
    </Link>
  );
};