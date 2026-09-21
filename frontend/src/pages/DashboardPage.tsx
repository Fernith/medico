import { useState, useEffect, useMemo } from 'react';
import { PasosWidget } from '../features/dashboard/PasosWidget';
import { SuenoWidget } from '../features/dashboard/SuenoWidget';
import { ReglaWidget } from '../features/dashboard/ReglaWidget';
import { Dumbbell, Loader2 } from 'lucide-react';
import { useAjustes } from '../context/AjustesContext';
import { PesoWidget } from '../features/dashboard/PesoWidget';
import { EntrenamientoActivo } from '../features/entrenamiento/activo/EntrenamientoActivo';
import { MedicamentosWidget } from '../features/dashboard/MedicamentosWidget';
import { RachaWidget } from '../features/dashboard/RachaWidget';
import { apiClient } from '../api/client';

interface PasosDB { 
  hoy: number; 
  total_mes: number; 
  ultima_fecha: string | null; 
}

interface SuenoDB { 
  fecha: string; 
  minutos_sueno: number; 
}

interface CicloDB {
  id: string | number;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export const DashboardPage = () => {
  const { ajustes } = useAjustes();
  const mostrarRegla = ajustes['mostrar_regla'] !== 'false';
  
  const mediaCiclo = Number(ajustes['duracion_media_ciclo']) || 28;
  const mediaPeriodo = Number(ajustes['duracion_media_periodo']) || 6;

  const [rawPasos, setRawPasos] = useState<PasosDB | null>(null);
  const [rawSueno, setRawSueno] = useState<SuenoDB[] | null>(null);
  const [rawCiclos, setRawCiclos] = useState<CicloDB[] | null>(null);

  const [isWorkoutActive, setIsWorkoutActive] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resPasos, resSueno, resCiclos] = await Promise.all([
          apiClient.get<PasosDB>('/pasos').catch(() => null),
          apiClient.get<SuenoDB[]>('/sueno').catch(() => null),
          mostrarRegla ? apiClient.get<CicloDB[]>('/ciclos').catch(() => null) : Promise.resolve(null)
        ]);

        if (resPasos?.data) setRawPasos(resPasos.data);
        if (resSueno?.data) setRawSueno(resSueno.data);
        if (resCiclos?.data) setRawCiclos(resCiclos.data);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [mostrarRegla]);

  // OPTIMIZACIÃ“N RENDIMIENTO: Memoizamos los cÃ¡lculos para no recalcular en cada render
  const datosPasos = useMemo(() => {
    if (!rawPasos || rawPasos.hoy === undefined) return null;
    return {
      hoy: rawPasos.hoy,
      totalMes: rawPasos.total_mes,
      ultimaFecha: rawPasos.ultima_fecha || null,
    };
  }, [rawPasos]);

  const datosSueno = useMemo(() => {
    if (!rawSueno || rawSueno.length === 0) return null;
    const valoresSueno = rawSueno.map(d => d.minutos_sueno);
    return {
      hoyMinutos: rawSueno[0].minutos_sueno,
      ultimos7DiasMin: Math.min(...valoresSueno),
      ultimos7DiasMax: Math.max(...valoresSueno),
      media7Dias: Math.round(valoresSueno.reduce((a, b) => a + b, 0) / valoresSueno.length),
      ultimaFecha: rawSueno[0].fecha,
    };
  }, [rawSueno]);

  const ultimoCiclo = useMemo(() => {
    if (!rawCiclos || rawCiclos.length === 0) return null;
    return [...rawCiclos].sort((a, b) => 
      new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    )[0];
  }, [rawCiclos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      {isWorkoutActive && <EntrenamientoActivo onClose={() => setIsWorkoutActive(false)} />}

      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Resumen</h1>
          
          <button 
            onClick={() => setIsWorkoutActive(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group w-full sm:w-auto"
          >
            <Dumbbell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Iniciar entrenamiento</span>
          </button>
        </header>
        
        <div className={`grid grid-cols-1 gap-4 ${mostrarRegla ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>

          <RachaWidget />
          
          <PesoWidget />

          {mostrarRegla && (
            <ReglaWidget 
              ultimoCiclo={ultimoCiclo} 
              mediaCiclo={mediaCiclo} 
              mediaPeriodo={mediaPeriodo} 
            />
          )}

          <MedicamentosWidget />

        </div>

        {datosSueno && <SuenoWidget data={datosSueno} />}
        {datosPasos && <PasosWidget data={datosPasos} />}
      </div>
    </>
  );
};