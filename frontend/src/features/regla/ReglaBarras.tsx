import React from 'react';
import type { Ciclo } from '../../utils/reglaCalculations';

interface ReglaBarrasProps {
  ciclos: Ciclo[];
  mediaCiclo: number;
}

export const ReglaBarras: React.FC<ReglaBarrasProps> = ({ ciclos, mediaCiclo }) => {
  const maxDias = Math.max(mediaCiclo + 5, 40); 

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
      {/* Contenedor con Scroll de tamaño de ~6 elementos */}
      <div className="max-h-[350px] overflow-y-auto relative pr-4 custom-scrollbar">
        
        {/* Línea vertical de la media adaptada al scroll */}
        <div 
          className="absolute top-0 bottom-0 border-l-2 border-gray-200 border-dashed z-0"
          style={{ left: `${(mediaCiclo / maxDias) * 100}%` }}
        >
          <span className="absolute -top-1 -ml-4 text-[10px] font-bold text-gray-400 bg-white px-1">
            Media
          </span>
        </div>

        <div className="space-y-6 relative z-10 pt-6 pb-2">
          {ciclos.map((ciclo, index) => {
            const inicio = new Date(ciclo.fecha_inicio);
            const fechaSiguiente = index > 0 ? new Date(ciclos[index - 1].fecha_inicio) : new Date();
            const duracionCiclo = Math.round((fechaSiguiente.getTime() - inicio.getTime()) / (1000 * 3600 * 24));
            
            const fin = ciclo.fecha_fin ? new Date(ciclo.fecha_fin) : new Date();
            const duracionPeriodo = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 3600 * 24)) + 1;

            return (
              <div key={ciclo.id} className="relative">
                <p className="text-xs text-gray-500 mb-1">
                  {inicio.toLocaleDateString()} - {ciclo.fecha_fin ? fin.toLocaleDateString() : 'En curso'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded-full flex-grow relative overflow-hidden" 
                       style={{ maxWidth: `${(duracionCiclo / maxDias) * 100}%`, minWidth: '20px' }}>
                    <div className="h-full bg-pink-400 rounded-full" 
                         style={{ width: `${(duracionPeriodo / duracionCiclo) * 100}%` }}>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-purple-900 w-12 shrink-0">
                    {duracionCiclo} días
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};