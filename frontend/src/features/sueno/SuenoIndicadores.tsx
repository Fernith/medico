import React, { useMemo, useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { type SuenoDB, formatMinutos, calcularIndicadoresSueno } from '../../utils/suenoCalculations';
import { useAjustes } from '../../context/AjustesContext';

interface SuenoIndicadoresProps {
  data: SuenoDB[];
  rango: '7d' | '14d' | '1m' | '3m' | '6m' | 'custom';
  customDias: number | '';
}

// Subcomponente rediseñado para el Tooltip de Información
const InfoTooltip = ({ 
  id, activeId, setActiveId, text 
}: { 
  id: string, activeId: string | null, setActiveId: (id: string | null) => void, text: string 
}) => {
  return (
    <div className="relative flex items-center group shrink-0 mt-[1px]">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Evita que el evento global lo cierre al instante
          setActiveId(activeId === id ? null : id);
        }}
        className="text-current opacity-40 hover:opacity-100 transition-opacity p-0.5 rounded-full outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      
      <div 
        onClick={(e) => e.stopPropagation()} // Permite interactuar con el texto sin cerrarlo
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 z-50 bg-white p-4 rounded-2xl shadow-[0_15px_40px_rgb(0,0,0,0.12)] border border-slate-100 text-left origin-bottom transition-all duration-200 ${
          activeId === id 
            ? 'opacity-100 scale-100 pointer-events-auto' 
            : 'opacity-0 scale-95 pointer-events-none md:group-hover:opacity-100 md:group-hover:scale-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-2">
           <Info className="w-4 h-4 text-indigo-500 shrink-0" />
           <span className="font-black text-slate-700 text-[10px] uppercase tracking-widest">¿Qué significa?</span>
        </div>
        <p className="text-xs font-medium text-slate-600 leading-relaxed">
          {text}
        </p>
        {/* Flechita del tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white"></div>
      </div>
    </div>
  );
};

export const SuenoIndicadores: React.FC<SuenoIndicadoresProps> = ({ data, rango, customDias }) => {
  const { ajustes } = useAjustes();
  
  const objHoras = Number(ajustes['objetivo_horas_sueno']) || 8;
  const limiteDeuda = Number(ajustes['limite_deuda_sueno']) || 5;

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Lógica global: Hacer click en CUALQUIER lugar de la pantalla cierra el tooltip abierto
  useEffect(() => {
    const handleOutsideClick = () => setActiveTooltip(null);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const rangoLabel = useMemo(() => {
    if (rango === '7d') return '7 Días';
    if (rango === '14d') return '14 Días';
    if (rango === '1m') return '1 Mes';
    if (rango === '3m') return '3 Meses';
    if (rango === '6m') return '6 Meses';
    if (rango === 'custom') return `${customDias || 7} Días`;
    return '';
  }, [rango, customDias]);

  const { deudaData, jetlagData, devData, avgData } = useMemo(() => {
    return calcularIndicadoresSueno(data, rango, customDias, objHoras);
  }, [data, rango, customDias, objHoras]);

  const isDeudaPeligrosa = deudaData > limiteDeuda;
  const isDeudaAceptable = deudaData > 0 && deudaData <= limiteDeuda;

  const bgDeuda = isDeudaPeligrosa ? 'bg-red-50 border-red-200' : isDeudaAceptable ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200';
  const textTitleDeuda = isDeudaPeligrosa ? 'text-red-500' : isDeudaAceptable ? 'text-blue-500' : 'text-emerald-500';
  const textValueDeuda = isDeudaPeligrosa ? 'text-red-700' : isDeudaAceptable ? 'text-blue-700' : 'text-emerald-700';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
      
      {/* 1. DEUDA DE SUEÑO */}
      <div className={`p-4 sm:p-5 rounded-3xl shadow-sm border relative ${bgDeuda}`}>
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className={`flex items-start gap-1.5 ${textTitleDeuda} min-w-0`}>
            <p className="text-[11px] xl:text-xs font-bold uppercase tracking-widest leading-snug break-words">Deuda de Sueño</p>
            <InfoTooltip 
              id="deuda" activeId={activeTooltip} setActiveId={setActiveTooltip}
              text="Diferencia acumulada en los últimos 14 días entre tu objetivo y lo que has dormido. Las siestas estratégicas reducen esta deuda. Una deuda alta impacta negativamente tu rendimiento, metabolismo y sistema inmune."
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 text-slate-500 flex items-center gap-1 cursor-help" title="Valor fijo no afectado por la gráfica. Incluye amortización por siestas.">
            📌 Fijo 14d
          </span>
        </div>
        <p className={`text-2xl sm:text-3xl font-black ${textValueDeuda}`}>
          {deudaData <= 0 ? 'Sin Deuda 🎉' : formatMinutos(Math.round(deudaData * 60))}
        </p>
      </div>

      {/* 2. JETLAG SOCIAL */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200 relative">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-start gap-1.5 text-slate-500 min-w-0">
            <p className="text-[11px] xl:text-xs font-bold uppercase tracking-widest leading-snug break-words">Jetlag Social</p>
            <InfoTooltip 
              id="jetlag" activeId={activeTooltip} setActiveId={setActiveTooltip}
              text="Diferencia entre la mitad de tu ciclo de sueño en días laborables y en fines de semana (últimos 7 días). Un desfase mayor a 1 hora causa fatiga crónica y desajuste circadiano, como si cambiaras de zona horaria."
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 text-slate-500 flex items-center gap-1" title="Valor fijo no afectado por la gráfica">
            📌 Fijo 7d
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-slate-800">
          {jetlagData === null ? '--' : formatMinutos(Math.round(jetlagData))}
        </p>
      </div>

      {/* 3. DESVIACIÓN MEDIA */}
      <div className="bg-indigo-50/50 p-4 sm:p-5 rounded-3xl shadow-sm border border-indigo-100 relative">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-start gap-1.5 text-indigo-500 min-w-0">
            <p className="text-[11px] xl:text-xs font-bold uppercase tracking-widest leading-snug break-words">Desviación Media</p>
            <InfoTooltip 
              id="desviacion" activeId={activeTooltip} setActiveId={setActiveTooltip}
              text="Mide la irregularidad de tus horarios en este periodo. Alta variabilidad significa que te acuestas y levantas a horas distintas cada día, lo que dificulta el sueño profundo y altera tu reloj biológico."
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 flex items-center gap-1" title="Vinculado a la gráfica">
            📊 {rangoLabel}
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-indigo-900">
          {devData === 0 ? '--' : `± ${formatMinutos(Math.round(devData))}`}
        </p>
      </div>

      {/* 4. MEDIA NOCTURNA */}
      <div className="bg-indigo-50/50 p-4 sm:p-5 rounded-3xl shadow-sm border border-indigo-100 relative">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-start gap-1.5 text-indigo-500 min-w-0">
            <p className="text-[11px] xl:text-xs font-bold uppercase tracking-widest leading-snug break-words">Media Nocturna</p>
            <InfoTooltip 
              id="medianocturna" activeId={activeTooltip} setActiveId={setActiveTooltip}
              text="Promedio de horas de sueño principal (sin contar siestas) en este periodo. Te ayuda a visualizar tu tendencia real de descanso nocturno frente a tu objetivo diario."
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 flex items-center gap-1" title="Vinculado a la gráfica">
            📊 {rangoLabel}
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-indigo-900">
          {avgData === 0 ? '--' : formatMinutos(Math.round(avgData))}
        </p>
      </div>

    </div>
  );
};