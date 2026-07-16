import React, { useState, useEffect } from 'react';
import { type SuenoDB } from '../utils/suenoCalculations';
import { SuenoHorarioGrafica } from '../features/sueno/SuenoHorarioGrafica';
import { SuenoIndicadores } from '../features/sueno/SuenoIndicadores';
import { SuenoVariabilidadTabla } from '../features/sueno/SuenoVariabilidadTabla';

export type RangoTiempoSueno = '7d' | '14d' | '1m' | '3m' | 'custom';

export const SuenoPage: React.FC = () => {
  const [suenos, setSuenos] = useState<SuenoDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [rango, setRango] = useState<RangoTiempoSueno>('7d');
  const [customDias, setCustomDias] = useState<number | ''>('');

  const fetchSueno = async () => {
    try {
      const res = await fetch('/api/sueno');
      if (res.ok) {
        const data = await res.json();
        setSuenos(data.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      }
    } catch (err) {
      console.error('Error al obtener datos de sueño', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSueno();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sincronizar_google_fit', { method: 'POST' });
      if (res.ok) {
        await fetchSueno();
      } else {
        alert('Hubo un problema sincronizando con Google Fit.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 pb-24">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-indigo-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">😴</span>
          <h1 className="text-3xl font-bold text-slate-800">Análisis de Sueño</h1>
        </div>
        
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50"
        >
          <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Google Fit'}
        </button>
      </div>

      {!isLoading && (
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