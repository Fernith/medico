import React, { useState, useEffect } from 'react';
import { Dumbbell, Settings2, BookOpen, Layers, BarChart3 } from 'lucide-react';
import { EjerciciosTabla } from '../features/entrenamiento/EjerciciosTabla';
import { GruposTabla } from '../features/entrenamiento/GruposTabla';
import { EquipamientoTabla } from '../features/entrenamiento/EquipamientoTabla';
import { TipoEntrenamientoTabla } from '../features/entrenamiento/TipoEntrenamientoTabla';
import { RealizacionTabla } from '../features/entrenamiento/RealizacionTabla';
import { RutinasTabla } from '../features/entrenamiento/RutinasTabla';
import { type Ejercicio } from '../features/entrenamiento/EjercicioForm';
import { EstadisticasDashboard } from '../features/entrenamiento/estadisticas/EstadisticasDashboard';

export const EntrenamientoPage: React.FC = () => {
  // Estado para controlar la vista actual (por defecto en estadísticas)
  const [vista, setVista] = useState<'estadisticas' | 'configuracion'>('estadisticas');
  
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEjercicios = async () => {
    try {
      const res = await fetch('/api/ejercicios');
      if (res.ok) setEjercicios(await res.json());
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchEjercicios();
    const handleRegistro = (e: any) => { if (e.detail === 'ejercicio') fetchEjercicios(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 pb-24 animate-in fade-in duration-500">
      
      {/* TÍTULO CON FORMATO REGLA (Adaptado a Entrenamiento) */}
      <div className="flex items-center gap-3 border-b-2 border-indigo-200 pb-4">
        <Dumbbell className="w-10 h-10 text-indigo-600" />
        <h1 className="text-3xl font-bold text-slate-800">Entrenamiento</h1>
      </div>

      {/* SELECTOR DE VISTAS */}
      <div className="flex space-x-2 bg-indigo-50 p-1 rounded-lg w-max">
        <button
          onClick={() => setVista('estadisticas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            vista === 'estadisticas' ? 'bg-indigo-500 text-white shadow' : 'text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Estadísticas
        </button>
        <button
          onClick={() => setVista('configuracion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            vista === 'configuracion' ? 'bg-indigo-500 text-white shadow' : 'text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Settings2 className="w-4 h-4" /> Configuración
        </button>
      </div>

      {!isLoading ? (
        <div className="mt-4">
          
          {/* VISTA: ESTADÍSTICAS */}
          {vista === 'estadisticas' && (
            <div className="w-full animate-in fade-in duration-300">
              <EstadisticasDashboard />
            </div>
          )}

          {/* VISTA: CONFIGURACIÓN (Lo que ya teníamos construido) */}
          {vista === 'configuracion' && (
            <div className="flex flex-col gap-12 animate-in fade-in duration-300">
              
              {/* SECCIÓN PRINCIPAL: RUTINAS */}
              <div className="w-full">
                 <RutinasTabla />
              </div>
              
              {/* SECCIÓN SECUNDARIA: REALIZACIONES */}
              <div className="w-full space-y-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2 border-b border-slate-200 pb-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-lg">Configuración de Ejercicios Base</h3>
                </div>
                <RealizacionTabla />
              </div>

              {/* DICCIONARIO */}
              <div className="w-full space-y-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2 border-b border-slate-200 pb-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-lg">Catálogo Maestro de Ejercicios</h3>
                </div>
                <EjerciciosTabla ejercicios={ejercicios} />
              </div>

              {/* ADMINISTRACIÓN */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-600 mb-4">
                  <Settings2 className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-lg">Administración de Datos</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="w-full"><GruposTabla /></div>
                  <div className="w-full"><EquipamientoTabla /></div>
                  <div className="w-full"><TipoEntrenamientoTabla /></div>
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
};