import { useState, useEffect } from 'react';
import { PasosWidget } from '../features/dashboard/PasosWidget';
import { SuenoWidget } from '../features/dashboard/SuenoWidget';
import { ReglaWidget } from '../features/dashboard/ReglaWidget';
import { Link } from 'react-router-dom';
import { Dumbbell, Pill, Stethoscope } from 'lucide-react';
import { useAjustes } from '../context/AjustesContext';
import { PesoWidget } from '../features/dashboard/PesoWidget';

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

  const [datosPasos, setDatosPasos] = useState<{ hoy: number, meta: number, totalMes: number, metaMensual: number, ultimaFecha: string | null } | null>(null);
  const [datosSueno, setDatosSueno] = useState<{ hoyMinutos: number, ultimos7DiasMin: number, ultimos7DiasMax: number, media7Dias: number, ultimaFecha: string | null } | null>(null);
  const [ultimoCiclo, setUltimoCiclo] = useState<CicloDB | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPasos = await fetch('/api/pasos');
        const pasosJson: PasosDB = await resPasos.json();

        if (pasosJson && pasosJson.hoy !== undefined) {
          const metaDiaria = 8000;
          const fechaActual = new Date();
          const diasDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).getDate();
          
          setDatosPasos({
            hoy: pasosJson.hoy,
            meta: metaDiaria,
            totalMes: pasosJson.total_mes,
            metaMensual: metaDiaria * diasDelMes,
            ultimaFecha: pasosJson.ultima_fecha || null,
          });
        }

        const resSueno = await fetch('/api/sueno');
        const suenoJson: SuenoDB[] = await resSueno.json();

        if (suenoJson && suenoJson.length > 0) {
          const valoresSueno = suenoJson.map((d: any) => d.minutos_sueno);
          setDatosSueno({
            hoyMinutos: suenoJson[0].minutos_sueno,
            ultimos7DiasMin: Math.min(...valoresSueno),
            ultimos7DiasMax: Math.max(...valoresSueno),
            media7Dias: Math.round(valoresSueno.reduce((a: number, b: number) => a + b, 0) / valoresSueno.length),
            ultimaFecha: suenoJson[0].fecha,
          });
        }

        if (mostrarRegla) {
          const resCiclos = await fetch('/api/ciclos');
          if (resCiclos.ok) {
            const ciclosJson: CicloDB[] = await resCiclos.json();
            if (ciclosJson && ciclosJson.length > 0) {
              const ciclosOrdenados = ciclosJson.sort((a, b) => 
                new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
              );
              setUltimoCiclo(ciclosOrdenados[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [mostrarRegla]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Resumen</h1>
        
        <button 
          onClick={() => console.log('Iniciar entrenamiento')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group w-full sm:w-auto"
        >
          <Dumbbell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Iniciar entrenamiento</span>
        </button>
      </header>

      {datosSueno && <SuenoWidget data={datosSueno} />}
      {datosPasos && <PasosWidget data={datosPasos} />}
      
      {/* CUADRÍCULA DINÁMICA: 4 columnas si hay regla, 3 si no */}
      <div className={`grid grid-cols-1 gap-4 ${mostrarRegla ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>

          <PesoWidget />

          {mostrarRegla && (
            <ReglaWidget 
              ultimoCiclo={ultimoCiclo} 
              mediaCiclo={mediaCiclo} 
              mediaPeriodo={mediaPeriodo} 
            />
          )}

          <Link to="/medicamentos" className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group">
            <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><Pill className="w-8 h-8" /></div>
            <span className="font-bold text-slate-700">Medicamentos</span>
          </Link>

          <Link to="/sintomas" className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group">
            <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform"><Stethoscope className="w-8 h-8" /></div>
            <span className="font-bold text-slate-700">Síntomas</span>
          </Link>

      </div>
    </div>
  );
};