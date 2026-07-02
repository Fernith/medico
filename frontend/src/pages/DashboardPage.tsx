import { useState, useEffect } from 'react';
import { PasosWidget } from '../features/dashboard/PasosWidget';
import { SuenoWidget } from '../features/dashboard/SuenoWidget';
import { Link } from 'react-router-dom';
import { Pill, Scale, Stethoscope, Activity, Droplet } from 'lucide-react';
import { useAjustes } from '../context/AjustesContext';

interface PasosDB { 
  hoy: number; 
  total_mes: number; 
  ultima_fecha: string | null; 
}

interface SuenoDB { 
  fecha: string; 
  minutos_sueno: number; 
}

export const DashboardPage = () => {
  const { ajustes } = useAjustes();
  const mostrarRegla = ajustes['mostrar_regla'] !== 'false';
  const [datosPasos, setDatosPasos] = useState<{ hoy: number, meta: number, totalMes: number, metaMensual: number, ultimaFecha: string | null } | null>(null);
  const [datosSueno, setDatosSueno] = useState<{ hoyMinutos: number, ultimos7DiasMin: number, ultimos7DiasMax: number, media7Dias: number, ultimaFecha: string | null } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPasos = await fetch('http://localhost:3000/api/pasos');
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

        const resSueno = await fetch('http://localhost:3000/api/sueno');
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
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Resumen</h1>
      </header>

      {datosSueno && <SuenoWidget data={datosSueno} />}
      {datosPasos && <PasosWidget data={datosPasos} />}
      
      {/* EL GRID DE 1x4 (Móvil) y Dinámico (PC) */}
      <div className={`grid grid-cols-1 gap-4 ${mostrarRegla ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          
          <Link to="/medicamentos" className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group">
            <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><Pill className="w-8 h-8" /></div>
            <span className="font-bold text-slate-700">Medicamentos</span>
          </Link>

          <Link to="/peso" className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group">
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform"><Scale className="w-8 h-8" /></div>
            <span className="font-bold text-slate-700">Peso</span>
          </Link>

          <Link to="/sintomas" className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group">
            <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform"><Stethoscope className="w-8 h-8" /></div>
            <span className="font-bold text-slate-700">Síntomas</span>
          </Link>

          {mostrarRegla && (
            <Link to="/regla" className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group">
              <div className="p-4 bg-pink-50 text-pink-500 rounded-2xl group-hover:scale-110 transition-transform"><Droplet className="w-8 h-8" /></div>
              <span className="font-bold text-slate-700">Regla</span>
            </Link>
          )}
      </div>
    </div>
  );
};