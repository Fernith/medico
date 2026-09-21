import React, { useState, useEffect, useMemo } from 'react';
import { Footprints , Loader2} from 'lucide-react';
import { type PasoDB, procesarDatosGrafica, calcularIndicadores } from '../utils/pasosCalculations';
import { PasosGrafica } from '../features/pasos/PasosGrafica';
import { PasosIndicadores } from '../features/pasos/PasosIndicadores';
import { PasosTabla } from '../features/pasos/PasosTabla';
import { useAjustes } from '../context/AjustesContext';
import { apiFetch } from '../api/client';


export const PasosPage: React.FC = () => {
  const [pasos, setPasos] = useState<PasoDB[]>([]);
  const [usuario, setUsuario] = useState({ altura: 170, sexo: 'Masculino' });
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'S' | 'M' | 'A'>('M'); 
  const [refDate, setRefDate] = useState(new Date());

  const { ajustes } = useAjustes();
  const objetivoDiario = Number(ajustes['objetivo_pasos_diarios']) || 8000;

  const fetchData = async () => {
    try {
      const [resPasos, resUsu] = await Promise.all([
        apiFetch('/api/pasos/historial'),
        apiFetch('/api/usuario')
      ]);
      if (resPasos.ok) setPasos(await resPasos.json());
      if (resUsu.ok) setUsuario(await resUsu.json());
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const { chartData, startPeriod, endPeriod, metrics } = useMemo(() => {
    const dataGrafica = procesarDatosGrafica(pasos, viewMode, refDate);
    const kpis = calcularIndicadores(dataGrafica.data, usuario.altura, usuario.sexo);
    
    return {
      chartData: dataGrafica.data,
      startPeriod: dataGrafica.startPeriod,
      endPeriod: dataGrafica.endPeriod,
      metrics: kpis
    };
  }, [pasos, viewMode, refDate, usuario.altura, usuario.sexo]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24">
      <div className="flex items-center gap-3 border-b-2 border-orange-200 pb-4">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl shadow-sm text-white">
          <Footprints className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Actividad Física</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Seguimiento de pasos y distancias</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-6">
          <PasosGrafica 
            data={chartData}
            viewMode={viewMode}
            setViewMode={setViewMode}
            refDate={refDate}
            setRefDate={setRefDate}
            startPeriod={startPeriod}
            endPeriod={endPeriod}
            alturaCm={usuario.altura}
            sexo={usuario.sexo}
            objetivoDiario={objetivoDiario}
            avgPasos={metrics.avgPasos}
          />

          <PasosIndicadores 
            totalPasos={metrics.totalPasos}
            totalKm={metrics.totalKm}
            avgPasos={metrics.avgPasos}
            avgKm={metrics.avgKm}
            viewMode={viewMode}
          />

          <PasosTabla 
            pasos={pasos} 
            alturaCm={usuario.altura} 
            sexo={usuario.sexo} 
            onDataChanged={fetchData} 
          />
        </div>
      )}
    </div>
  );
};