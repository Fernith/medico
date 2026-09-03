import React from 'react';
import { calcularIMC, obtenerColorIMC } from '../../utils/pesoCalculations';

interface IMCWidgetProps {
  pesoActual: number | null;
  altura: number;
}

export const IMCWidget: React.FC<IMCWidgetProps> = ({ pesoActual, altura }) => {
  if (!pesoActual) return null;
  
  const imcActual = calcularIMC(pesoActual, altura);
  const infoIMC = obtenerColorIMC(imcActual);

  return (
    <div className={`p-6 rounded-2xl border flex flex-col ${infoIMC.clases} transition-colors duration-500`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest opacity-80">Índice de Masa Corporal</p>
          <p className="text-4xl font-black mt-1">{imcActual}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{infoIMC.texto}</p>
        </div>
      </div>
      
      <div className="pt-4 border-t border-current/20 flex flex-col gap-3 mt-auto">
        <div>
          <p className="font-black uppercase tracking-wider text-[10px] opacity-60 mb-0.5">¿Qué mide el IMC?</p>
          <p className="text-xs font-medium opacity-90 leading-relaxed">
            El Índice de Masa Corporal relaciona tu peso y altura para estimar si tienes una masa corporal proporcionada y globalmente saludable.
          </p>
        </div>
        
        <div>
          <p className="font-black uppercase tracking-wider text-[10px] opacity-60 mb-0.5">Tu Valoración:</p>
          <p className="text-xs font-bold opacity-95 leading-relaxed">
            {infoIMC.descripcion}
          </p>
        </div>
      </div>
    </div>
  );
};