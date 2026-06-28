import { useEffect, useState } from 'react';
import { PesoForm } from './features/peso/PesoForm';
import { TablaPesos } from './features/peso/TablaPesos';
import { DashboardSueno } from './features/sueno/DashboardSueno';
import { BotonSync } from './features/sueno/BotonSync';
import api from './api/client';

export default function App() {
  const [pesos, setPesos] = useState([]);
  const [sueno, setSueno] = useState([]);

  const cargarDatos = async () => {
    try {
      const [resPesos, resSueno] = await Promise.all([
        api.get('/api/pesos'),
        api.get('/api/sueno')
      ]);
      setPesos(resPesos.data);
      setSueno(resSueno.data);
    } catch (err) {
      console.error("Error cargando históricos médicos", err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="h-3 w-3 bg-blue-600 rounded-full"></span>
            Panel de Salud Privado
          </h1>
          <BotonSync onSyncComplete={cargarDatos} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <PesoForm onSuccess={cargarDatos} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Historial de Peso</h2>
              <TablaPesos datos={pesos} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Horas de Sueño (Google Fit)</h2>
              <DashboardSueno datos={sueno} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}