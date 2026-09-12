import React, { useState, useEffect, useRef } from 'react';

interface CalendarioMesEntrenoProps {
  year: number;
  month: number;
  calendarioRutinas: Record<string, { rutina_nombre: string; color: string | null }[]>;
}

export const CalendarioMesEntreno: React.FC<CalendarioMesEntrenoProps> = ({ year, month, calendarioRutinas }) => {
  const nombreMes = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long' });
  
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const primerDiaSemana = new Date(year, month, 1).getDay();
  const espaciosEnBlanco = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  const diasArray = Array.from({ length: diasEnMes }, (_, i) => i + 1);
  const blancosArray = Array.from({ length: espaciosEnBlanco }, (_, i) => i);
  const diasSemanaStr = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const formatDateStr = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const hoy = new Date();
  const esHoy = (d: number) => {
    return hoy.getDate() === d && hoy.getMonth() === month && hoy.getFullYear() === year;
  };

  // ESTADO Y REF PARA EL MODO MÓVIL (Click fuera para cerrar)
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleDayClick = (e: React.MouseEvent | React.TouchEvent, dia: number, hayEntreno: boolean) => {
    if (!hayEntreno) return;
    e.stopPropagation(); // Evita que el clickOutside lo cierre inmediatamente
    setActiveTooltip(activeTooltip === dia ? null : dia);
  };

  return (
    <div ref={calendarRef} className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm h-full flex flex-col min-h-0">
      <h3 className="text-center font-black text-indigo-900 uppercase tracking-widest text-sm mb-4 shrink-0">
        {nombreMes}
      </h3>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2 shrink-0">
        {diasSemanaStr.map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
        ))}
      </div>
      
      {/* ELIMINADO el overflow-hidden para que los tooltips puedan salirse del grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1 flex-1 content-start">
        {blancosArray.map(i => <div key={`blank-${i}`} />)}
        
        {diasArray.map(dia => {
          const strFecha = formatDateStr(dia);
          const entrenos = calendarioRutinas[strFecha] || [];
          const hayEntreno = entrenos.length > 0;
          const hoyClases = esHoy(dia) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-transparent text-slate-600 hover:bg-slate-50';
          
          return (
            <div 
              key={dia} 
              onClick={(e) => handleDayClick(e, dia, hayEntreno)}
              className={`relative flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg border transition-colors cursor-default group ${hoyClases}`}
            >
              <span className={`text-sm font-semibold leading-none ${hayEntreno ? 'text-indigo-900' : ''}`}>{dia}</span>
              
              {/* PUNTITOS */}
              <div className="flex gap-0.5 sm:gap-1 mt-1 h-1.5 justify-center flex-wrap max-w-full">
                {entrenos.map((rutina, idx) => (
                  <div 
                    key={idx} 
                    className="w-1.5 h-1.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: rutina.color || '#6366f1' }}
                  />
                ))}
              </div>

              {/* TOOLTIP ELEGANTE Y FLOTANTE */}
              {hayEntreno && (
                <div 
                  className={`absolute bottom-full mb-3 z-[60] w-max max-w-[200px] bg-white p-3 rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] border border-indigo-50 text-center transition-all duration-200 origin-bottom ${
                    activeTooltip === dia 
                      ? 'opacity-100 scale-100 pointer-events-auto' 
                      : 'opacity-0 scale-95 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:scale-100'
                  }`}
                >
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">
                    {dia} de {nombreMes}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {entrenos.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 justify-start bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: r.color || '#6366f1' }} />
                        <span className="text-xs font-bold text-slate-700 truncate">{r.rutina_nombre}</span>
                      </div>
                    ))}
                  </div>
                  {/* Flechita inferior del Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};