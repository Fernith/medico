import React, { useState, useEffect } from 'react';
import { Dumbbell, Settings2, BookOpen, Layers } from 'lucide-react';
import { EjerciciosTabla } from '../features/entrenamiento/EjerciciosTabla';
import { GruposTabla } from '../features/entrenamiento/GruposTabla';
import { EquipamientoTabla } from '../features/entrenamiento/EquipamientoTabla';
import { RealizacionTabla } from '../features/entrenamiento/RealizacionTabla';
import { RutinasTabla } from '../features/entrenamiento/RutinasTabla'; // <-- IMPORTACIÓN NUEVA
import { type Ejercicio } from '../features/entrenamiento/EjercicioForm';

export const EntrenamientoPage: React.FC = () => {
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
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-4 border-b-2 border-indigo-200 pb-4">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
          <Dumbbell className="w-8 h-8" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Entrenamiento</h1>
          <p className="text-slate-500 font-medium mt-1">Planifica y ejecuta tus rutinas</p>
        </div>
      </div>

      {!isLoading ? (
        <div className="flex flex-col gap-12">
          
          {/* NUEVA SECCIÓN PRINCIPAL: RUTINAS */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full"><GruposTabla /></div>
              <div className="w-full"><EquipamientoTabla /></div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
};