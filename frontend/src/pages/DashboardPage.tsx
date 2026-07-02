import { useState, useEffect } from 'react';
import { PasosWidget } from '../features/dashboard/PasosWidget';
import { SuenoWidget } from '../features/dashboard/SuenoWidget';

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
    <div className="space-y-8">
      {datosSueno && <SuenoWidget data={datosSueno} />}
      {datosPasos && <PasosWidget data={datosPasos} />}
    </div>
  );
};