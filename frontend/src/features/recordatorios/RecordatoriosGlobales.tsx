import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface RecordatorioAlerta {
  clave: string;
  nombre: string;
  descripcion: string;
  dias: number;
  entidad: string;
  dias_extra: number;
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
    const handleRegistro = () => checkRecordatorios();
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handlePosponer = async (clave: string) => {
    try {
      await fetch(`/api/recordatorios/${clave}/posponer`, { method: 'PATCH' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'recordatorio' }));
    } catch (err) {
      console.error("Error al posponer recordatorio", err);
    }
  };

  const getTheme = (dias_extra: number, limite: number) => {
    if (dias_extra >= limite) {
      // ROJO: Ha pasado el doble del tiempo (retraso crítico)
      return {
        bg: "bg-rose-50 border-rose-200", dec: "bg-rose-500/5", iconBg: "bg-rose-100 text-rose-600",
        title: "text-rose-900", badge: "bg-rose-200 text-rose-800", desc: "text-rose-700/80",
        btn: "bg-rose-100 text-rose-600 hover:bg-rose-200 hover:text-rose-800 border border-rose-200"
      };
    } else if (dias_extra > 0) {
      // AMARILLO: Tiene retraso (1 o más días) pero no es crítico aún
      return {
        bg: "bg-amber-50 border-amber-200", dec: "bg-amber-500/5", iconBg: "bg-amber-100 text-amber-600",
        title: "text-amber-900", badge: "bg-amber-200 text-amber-800", desc: "text-amber-700/80",
        btn: "bg-amber-100 text-amber-600 hover:bg-amber-200 hover:text-amber-800 border border-amber-200"
      };
    } else {
      // VERDE: Es el día exacto (0 días extra)
      return {
        bg: "bg-emerald-50 border-emerald-200", dec: "bg-emerald-500/5", iconBg: "bg-emerald-100 text-emerald-600",
        title: "text-emerald-900", badge: "bg-emerald-200 text-emerald-800", desc: "text-emerald-700/80",
        btn: "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-800 border border-emerald-200"
      };
    }
  };

  if (alertas.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3 mb-6 animate-in slide-in-from-top-4 fade-in duration-500">
      {alertas.map(alerta => {
        const t = getTheme(alerta.dias_extra, alerta.dias);
        
        let textoAviso = '¡HOY!';
        if (alerta.dias_extra > 0 && alerta.dias_extra !== 999) {
          textoAviso = `+${alerta.dias_extra} DÍAS`;
        } else if (alerta.dias_extra === 999) {
          textoAviso = 'SIN REGISTROS';
        }

        return (
          <div key={alerta.clave} className={`${t.bg} rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-4 shadow-sm relative overflow-hidden flex-col sm:flex-row`}>
            {/* Decoración sutil de fondo */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${t.dec} rounded-full -translate-y-1/2 translate-x-1/3`}></div>
            
            <div className="flex w-full sm:w-auto items-start gap-4 flex-1 relative z-10">
              <div className={`p-3 ${t.iconBg} rounded-xl shrink-0`}>
                <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
              </div>
              
              <div className="flex-1 pr-2 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold ${t.title}`}>{alerta.nombre}</h3>
                  <span className={`${t.badge} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md`}>
                    {textoAviso}
                  </span>
                </div>
                <p className={`text-sm font-medium ${t.desc} leading-relaxed`}>
                  {alerta.descripcion || "Tienes un recordatorio pendiente por revisar."}
                </p>
              </div>
            </div>

            {/* BOTÓN POSPONER: SOLO VISIBLE SI LA ENTIDAD ES "FECHA" */}
            {alerta.entidad === 'fecha' && (
              <div className="w-full sm:w-auto mt-2 sm:mt-0 relative z-10">
                <button 
                  onClick={() => handlePosponer(alerta.clave)}
                  className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${t.btn}`}
                  title={`Posponer recordatorio por ${alerta.dias} días`}
                >
                  <Clock className="w-4 h-4" strokeWidth={2.5} /> 
                  <span>Posponer</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};