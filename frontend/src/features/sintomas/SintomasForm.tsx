import React, { useState } from 'react';
import { SintomasAnatomiaMapa, type ZonaSeleccionada } from './SintomasAnatomiaMapa';

export const SintomasForm: React.FC = () => {
  // Aquí almacenaremos el array final con los clics procesados (Foco/Irradiado/Lado)
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<ZonaSeleccionada[]>([]);

  return (
    <div className="flex flex-col gap-8">
      
      {/* 1. MÓDULO VISUAL: MAPA ANATÓMICO */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-rose-100">
        <h2 className="text-xl font-black text-slate-800 mb-2">Localización del Síntoma</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Selecciona la zona afectada. Haz <b>un clic</b> para marcar el foco principal, y <b>dos clics</b> para indicar que el dolor se irradia a esa zona.
        </p>
        
        <SintomasAnatomiaMapa onSelectionChange={setZonasSeleccionadas} />
      </div>

      {/* 2. MÓDULO DE DATOS: CAMPOS DEL FORMULARIO (En Construcción) */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 opacity-60">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black text-slate-800">Detalles de la Ocurrencia</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
            Próximamente
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Aquí configuraremos la intensidad, fecha, hora y el catálogo maestro de síntomas.
        </p>
        
        <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50">
          <span className="text-slate-400 font-medium text-sm">Esperando diseño del formulario...</span>
        </div>
      </div>

    </div>
  );
};