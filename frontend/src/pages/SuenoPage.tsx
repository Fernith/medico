import React, { useState, useEffect, useMemo } from 'react';
import { type SuenoDB } from '../utils/suenoCalculations';
import { SuenoHorarioGrafica } from '../features/sueno/SuenoHorarioGrafica';
import { SuenoIndicadores } from '../features/sueno/SuenoIndicadores';
import { SuenoVariabilidadTabla } from '../features/sueno/SuenoVariabilidadTabla';
import { apiFetch } from '../api/client';
import { Loader2 } from 'lucide-react';

export type RangoTiempoSueno = '7d' | '14d' | '1m' | '3m' | '6m' | 'custom';

export const SuenoPage: React.FC = () => {
  const [rawSuenos, setRawSuenos] = useState<SuenoDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rango, setRango] = useState<RangoTiempoSueno>('7d');
  const [customDias, setCustomDias] = useState<number | ''>('');

  const fetchSueno = async () => {
    try {
      const res = await apiFetch('/api/sueno');
      if (res.ok) {
        const data = await res.json();
        setRawSuenos(data);
      }
    } catch (err) {
      console.error('Error al obtener datos de sueÃ±o', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSueno();
  }, []);

  // OPTIMIZACIÃ“N RENDIMIENTO: Memoizamos la ordenaciÃ³n para no mutar el array original 
  // ni depender del fetch interno, manteniÃ©ndolo puro para react.
  const suenos = useMemo(() => {
    return [...rawSuenos].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [rawSuenos]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 pb-24">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-indigo-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">😴</span>
          <h1 className="text-3xl font-bold text-slate-800">Análisis de Sueño</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* NUEVOS WIDGETS DE MEDICINA PREVENTIVA */}
          <SuenoIndicadores 
            data={suenos} 
            rango={rango} 
            customDias={customDias} 
          />

          {/* GRÁFICA DE GANTT */}
          <SuenoHorarioGrafica 
            data={suenos} 
            rango={rango}
            setRango={setRango}
            customDias={customDias}
            setCustomDias={setCustomDias}
          />

          <SuenoVariabilidadTabla data={suenos} />
          
        </div>
      )}
    </div>
  );
};