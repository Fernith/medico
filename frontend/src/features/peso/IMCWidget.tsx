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
    <div className={`p-6 rounded-2xl border flex items-center justify-between ${infoIMC.clases} transition-colors duration-500`}>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest opacity-80">Índice de Masa Corporal</p>
        <p className="text-4xl font-black mt-1">{imcActual}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold">{infoIMC.texto}</p>
      </div>
    </div>
  );
};