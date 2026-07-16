import React, { useMemo } from 'react';
import { type SuenoDB, getChartY } from '../../utils/suenoCalculations';

interface SuenoVariabilidadTablaProps {
  data: SuenoDB[];
}

export const SuenoVariabilidadTabla: React.FC<SuenoVariabilidadTablaProps> = ({ data }) => {
  const stats = useMemo(() => {
    // Función interna para calcular medias y variabilidad según los días
    const calculateForDays = (days: number) => {
      const limitDate = new Date();
      limitDate.setHours(0, 0, 0, 0);
      limitDate.setDate(limitDate.getDate() - days);

      const filtered = data.filter(d => new Date(d.fecha) >= limitDate);

      const getStats = (type: 'inicio' | 'fin') => {
        // Obtenemos los valores numéricos desplazados (14:00 a 38:00) para evitar bugs de medianoche
        const vals = filtered
          .map(d => getChartY(type === 'inicio' ? d.hora_inicio : d.hora_fin))
          .filter((v): v is number => v !== null && !isNaN(v));

        if (vals.length === 0) return null;

        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length;
        const stdDev = Math.sqrt(variance);

        return { mean, stdDev };
      };

      const formatStat = (stat: { mean: number, stdDev: number } | null) => {
        if (!stat) return '--:--';
        
        // Deshacemos el desplazamiento para mostrar la hora real
        const h = Math.floor(stat.mean) % 24;
        const m = Math.round((stat.mean - Math.floor(stat.mean)) * 60);
        
        // Manejamos el desborde de minutos si el redondeo da 60
        const finalH = m === 60 ? (h + 1) % 24 : h;
        const finalM = m === 60 ? 0 : m;

        const timeStr = `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
        const stdDevMin = Math.round(stat.stdDev * 60);
        
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{timeStr}</span>
            <span className={`text-sm px-2 py-0.5 rounded-md font-semibold ${stdDevMin > 60 ? 'bg-red-100 text-red-600' : stdDevMin > 30 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              ± {stdDevMin} m
            </span>
          </div>
        );
      };

      return {
        dias: days,
        etiqueta: `Últimos ${days} días`,
        acostarse: formatStat(getStats('inicio')),
        despertarse: formatStat(getStats('fin')),
      };
    };

    return [
      calculateForDays(7),
      calculateForDays(14),
      calculateForDays(30),
    ];
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-50">
      <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
        <span className="text-indigo-500">⏳</span> Variabilidad y Estabilidad
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-indigo-100">
              <th className="pb-3 pt-2 px-4 text-xs font-bold uppercase tracking-widest text-indigo-400">Periodo</th>
              <th className="pb-3 pt-2 px-4 text-xs font-bold uppercase tracking-widest text-indigo-400">Hora de Acostarse</th>
              <th className="pb-3 pt-2 px-4 text-xs font-bold uppercase tracking-widest text-indigo-400">Hora de Despertarse</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => (
              <tr key={row.dias} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-bold text-slate-600">{row.etiqueta}</td>
                <td className="py-4 px-4">{row.acostarse}</td>
                <td className="py-4 px-4">{row.despertarse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-4 px-2">
        * Se recomienda mantener una variabilidad inferior a <span className="font-bold text-slate-500">± 30 minutos</span> para una óptima higiene del sueño.
      </p>
    </div>
  );
};