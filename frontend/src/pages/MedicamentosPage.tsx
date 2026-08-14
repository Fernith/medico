import React, { useState, useEffect } from 'react';
import { Pill, Settings2, BarChart3, Archive } from 'lucide-react';
import { type Medicamento } from '../features/medicamentos/MedicamentoForm';
import { type MedicacionActiva } from '../features/medicamentos/MedicacionActivaForm';
import { MedicamentosTabla } from '../features/medicamentos/MedicamentosTabla';
import { CategoriasTabla } from '../features/medicamentos/CategoriasTabla';
import { MedicacionesActivasTabla } from '../features/medicamentos/MedicacionesActivasTabla';
import { HistorialMedicacionesTabla } from '../features/medicamentos/HistorialMedicacionesTabla'; // <-- IMPORTADO

export const MedicamentosPage: React.FC = () => {
  const [vista, setVista] = useState<'estadisticas' | 'configuracion'>('estadisticas');
  
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [activas, setActivas] = useState<MedicacionActiva[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [resMed, resAct] = await Promise.all([
        fetch('/api/medicamentos'),
        fetch('/api/medicaciones-activas')
      ]);
      if (resMed.ok) setMedicamentos(await resMed.json());
      if (resAct.ok) setActivas(await resAct.json());
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const handleRegistro = (e: any) => { 
      if (['medicamento', 'medicacion_activa'].includes(e.detail)) fetchData(); 
    };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 pb-24 animate-in fade-in duration-500">
      
      {/* TÍTULO */}
      <div className="flex items-center gap-3 border-b-2 border-teal-200 pb-4">
        <Pill className="w-10 h-10 text-teal-600" />
        <h1 className="text-3xl font-bold text-slate-800">Medicación y Suplementos</h1>
      </div>

      {/* SELECTOR DE VISTAS */}
      <div className="flex space-x-2 bg-teal-50 p-1 rounded-lg w-max">
        <button
          onClick={() => setVista('estadisticas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            vista === 'estadisticas' ? 'bg-teal-500 text-white shadow' : 'text-teal-700 hover:bg-teal-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Estadísticas
        </button>
        <button
          onClick={() => setVista('configuracion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            vista === 'configuracion' ? 'bg-teal-500 text-white shadow' : 'text-teal-700 hover:bg-teal-100'
          }`}
        >
          <Settings2 className="w-4 h-4" /> Configuración
        </button>
      </div>

      {!isLoading ? (
        <div className="mt-4">
          
          {/* VISTA: ESTADÍSTICAS E HISTORIAL */}
          {vista === 'estadisticas' && (
            <div className="w-full animate-in fade-in duration-300">
              <HistorialMedicacionesTabla />
            </div>
          )}

          {/* VISTA: CONFIGURACIÓN */}
          {vista === 'configuracion' && (
            <div className="flex flex-col gap-12 animate-in fade-in duration-300">
              
              <div className="w-full">
                 <MedicacionesActivasTabla activas={activas} medicamentos={medicamentos} />
              </div>

              <div className="w-full space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Archive className="w-5 h-5 text-teal-500" />
                  <h3 className="font-bold text-lg">Catálogo Maestro</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <MedicamentosTabla medicamentos={medicamentos} />
                  </div>
                  <div className="lg:col-span-1">
                    <CategoriasTabla />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
        </div>
      )}
    </div>
  );
};