import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface RecordatorioAlerta {
  clave: string;
  nombre: string;
  descripcion: string;
  dias: number;
  dias_transcurridos: number;
  alerta: boolean;
}

export const RecordatoriosGlobales: React.FC = () => {
  const [alertas, setAlertas] = useState<RecordatorioAlerta[]>([]);

  const checkRecordatorios = async () => {
    try {
      const res = await fetch('/api/recordatorios');
      if (res.ok) {
        const data: RecordatorioAlerta[] = await res.json();
        const activas = data.filter(r => r.alerta);
        setAlertas(activas);
      }
    } catch (err) {
      console.error("Error cargando recordatorios", err);
    }
  };

  useEffect(() => {
    checkRecordatorios();
    // Re-chequeamos cuando guardes cualquier dato en la app
    const handleRegistro = () => checkRecordatorios();
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  if (alertas.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3 mb-6 animate-in slide-in-from-top-4 fade-in duration-500">
      {alertas.map(alerta => (
        <div key={alerta.clave} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-sm relative overflow-hidden group">
          {/* Decoración sutil de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600 shrink-0">
            <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
          </div>
          
          <div className="flex-1 pr-6 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-amber-900">{alerta.nombre}</h3>
              <span className="bg-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                {alerta.dias_transcurridos >= 0 ? `Hace ${alerta.dias_transcurridos} días` : 'Sin registros'}
              </span>
            </div>
            <p className="text-sm font-medium text-amber-700/80 leading-relaxed">
              {alerta.descripcion || `Han pasado ${alerta.dias} días o más. ¡Es hora de actualizar tus datos!`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};