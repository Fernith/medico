import React from 'react';

interface CalendarioMesEntrenoProps {
  year: number;
  month: number;
  calendarioRutinas: Record<string, { rutina_nombre: string; color: string | null }[]>;
}

export const CalendarioMesEntreno: React.FC<CalendarioMesEntrenoProps> = ({ year, month, calendarioRutinas }) => {
  const nombreMes = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long' });
  
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const primerDiaSemana = new Date(year, month, 1).getDay();
  const espaciosEnBlanco = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1; // Lunes = 0

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

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm h-full flex flex-col">
      <h3 className="text-center font-black text-indigo-900 uppercase tracking-widest text-sm mb-4">
        {nombreMes}
      </h3>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {diasSemanaStr.map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 gap-x-1 flex-1">
        {blancosArray.map(i => <div key={`blank-${i}`} />)}
        
        {diasArray.map(dia => {
          const strFecha = formatDateStr(dia);
          const entrenos = calendarioRutinas[strFecha] || [];
          const hayEntreno = entrenos.length > 0;
          const hoyClases = esHoy(dia) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-transparent text-slate-600 hover:bg-slate-50';
          
          return (
            <div 
              key={dia} 
              className={`relative flex flex-col items-center justify-center p-1 rounded-lg border transition-colors cursor-default group ${hoyClases}`}
            >
              <span className={`text-sm font-semibold ${hayEntreno ? 'text-indigo-900' : ''}`}>{dia}</span>
              
              {/* Contenedor de puntitos para múltiples rutinas */}
              <div className="flex gap-1 mt-0.5 h-1.5 justify-center">
                {entrenos.map((rutina, idx) => (
                  <div 
                    key={idx} 
                    className="w-1.5 h-1.5 rounded-full shadow-sm"
                    style={{ backgroundColor: rutina.color || '#6366f1' }}
                  />
                ))}
              </div>

              {/* Tooltip Nativo al hacer hover */}
              {hayEntreno && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 w-max max-w-[150px] bg-slate-800 text-white text-xs font-bold p-2 rounded-lg shadow-xl text-center">
                  <p className="text-[10px] text-slate-400 mb-1">{dia} de {nombreMes}</p>
                  {entrenos.map((r, i) => (
                    <div key={i} className="truncate">{r.rutina_nombre}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};