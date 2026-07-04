import React from 'react';
import type { DiaEstado } from '../../utils/reglaCalculations';

interface CalendarioMesProps {
  year: number;
  month: number;
  mapaEstados: Record<string, DiaEstado>;
  isLarge?: boolean;
}

export const CalendarioMes: React.FC<CalendarioMesProps> = ({ year, month, mapaEstados, isLarge = false }) => {
  const nombreMes = new Date(year, month).toLocaleString('es-ES', { month: 'long'});
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const primerDiaSemana = new Date(year, month, 1).getDay();
  const diasVaciosInicio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);
  const vacios = Array.from({ length: diasVaciosInicio }, (_, i) => i);

  const hoy = new Date();
  const esHoy = (dia: number) => 
    hoy.getDate() === dia && hoy.getMonth() === month && hoy.getFullYear() === year;

  const getClasesDia = (dia: number) => {
    const fecha = new Date(year, month, dia);
    const fechaString = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');

    const estado = mapaEstados[fechaString];
    
    const tamanoBase = isLarge 
      ? "w-10 h-10 md:w-14 md:h-14 text-base md:text-lg" 
      : "w-8 h-8 text-sm";

    let baseClasses = `${tamanoBase} flex items-center justify-center relative z-10 transition-all mx-auto `;

    if (estado === 'periodo_real') {
      baseClasses += "bg-pink-400 text-white rounded-full font-medium shadow-sm";
    } else if (estado === 'periodo_predicho') {
      baseClasses += "border-2 border-pink-300 text-pink-600 rounded-full bg-pink-50/50";
    } else if (estado === 'ovulacion') {
      baseClasses += "border-2 border-blue-400 text-blue-600 rounded-full font-medium bg-blue-50/50";
    } else {
      baseClasses += "text-gray-700 hover:bg-gray-100 rounded-full";
    }

    if (esHoy(dia)) {
      baseClasses += " ring-2 ring-purple-600 ring-offset-1 font-bold";
    }

    return baseClasses;
  };

  return (
    // Añadimos h-full, flex y flex-col para que el contenedor ocupe todo el alto disponible en el grid
    <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100 w-full h-full flex flex-col">
      <h3 className={`text-center font-semibold text-purple-900 capitalize mb-4 ${isLarge ? 'text-xl' : 'text-base'}`}>
        {nombreMes}
      </h3>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {diasSemana.map((d) => (
          <div key={d} className={`font-bold text-gray-400 ${isLarge ? 'text-sm' : 'text-xs'}`}>
            {d}
          </div>
        ))}
      </div>
      
      {/* Añadimos flex-1 y content-start para alinear los días arriba aunque la caja crezca */}
      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {vacios.map((_, i) => (
          <div key={`empty-${i}`} className={isLarge ? 'h-10 md:h-14' : 'h-8'}></div>
        ))}
        
        {dias.map((dia) => (
          <div key={dia} className="flex justify-center items-center py-1">
            <div className={getClasesDia(dia)}>
              {dia}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};