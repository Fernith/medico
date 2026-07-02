import { useState, useEffect } from 'react';
import { getFechaFormateada } from '../utils/formatters';
import { SuenoWidget } from '../features/dashboard/SuenoWidget';
import { PasosWidget } from '../features/dashboard/PasosWidget';
import { Loader2 } from 'lucide-react';

interface SuenoDB { fecha: string; minutos_sueno: number; }
interface PasosDB { hoy: number; total_mes: number; }

export const DashboardPage = () => {
  const { diaSemana, fechaCompleta } = getFechaFormateada();
  
  // Estados para guardar los datos procesados
  const [datosSueno, setDatosSueno] = useState<any>(null);
  const [datosPasos, setDatosPasos] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hacemos las llamadas a Rust (Axum)
        const [resSueno, resPasos] = await Promise.all([
          fetch('/api/sueno'),
          fetch('/api/pasos')
        ]);

        const suenoJson: SuenoDB[] = await resSueno.json();
        const pasosJson: PasosDB = await resPasos.json();

        // 1. Procesar datos de Sueño
        if (suenoJson && suenoJson.length > 0) {
          const valoresSueno = suenoJson.map(d => d.minutos_sueno);
          setDatosSueno({
            hoyMinutos: suenoJson[0].minutos_sueno,
            ultimos7DiasMin: Math.min(...valoresSueno),
            ultimos7DiasMax: Math.max(...valoresSueno),
            media7Dias: Math.round(valoresSueno.reduce((a, b) => a + b, 0) / valoresSueno.length),
          });
        }
        // 2. Procesar datos de Pasos
        if (pasosJson && pasosJson.hoy !== undefined) {
          const metaDiaria = 8000;
          // Lógica para saber cuántos días tiene el mes actual
          const fechaActual = new Date();
          const diasDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).getDate();
          
          setDatosPasos({
            hoy: pasosJson.hoy,
            meta: metaDiaria,
            totalMes: pasosJson.total_mes,
            metaMensual: metaDiaria * diasDelMes,
          });
        }
      } catch (error) {
        console.error("Error cargando los datos del backend:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Resumen</h1>
          <p className="text-slate-500 font-medium mt-1 md:text-lg">Tu estado actual</p>
        </div>
        <div className="md:text-right bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none border md:border-none border-slate-100 shadow-sm md:shadow-none">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 capitalize">{diaSemana}</h2>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{fechaCompleta}</p>
        </div>
      </header>

      {/* Control de Carga (Si está esperando a Rust) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" />
          <p className="font-medium">Sincronizando tus datos...</p>
        </div>
      ) : (
        <>
          {/* Si no hay datos, mostramos un mensaje para que el usuario inicie sesión en Google */}
          {datosSueno ? (
            <SuenoWidget data={datosSueno} />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-500">
              <p className="mb-4">No hay datos de sueño recientes.</p>
              <a href="http://localhost:3000/api/auth/google/login" className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors">
                Sincronizar con Google Fit
              </a>
            </div>
          )}

          {datosPasos && <PasosWidget data={datosPasos} />}
        </>
      )}
    </div>
  );
};