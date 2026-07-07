import React from 'react';
import type { Ciclo } from '../../utils/reglaCalculations';

interface ReglaBarrasProps {
  ciclos: Ciclo[];
  mediaCiclo: number;
}

export const ReglaBarras: React.FC<ReglaBarrasProps> = ({ ciclos, mediaCiclo }) => {
  // Calculamos el ciclo más largo real para establecer el 100% del ancho (con un mínimo de 35 para que no se vea gigante si el ciclo más largo es 20)
  const maxDiasReal = Math.max(
    ...ciclos.map((c, i) => {
      const inicio = new Date(c.fecha_inicio);
      const finDate = i > 0 ? new Date(ciclos[i - 1].fecha_inicio) : new Date();
      return Math.round((finDate.getTime() - inicio.getTime()) / (1000 * 3600 * 24));
    }),
    mediaCiclo + 5,
    35
  );

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
      {/* Añadimos un padding inferior extra (pb-6) para que la última barra no se corte con el scroll */}
      <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 pb-6 relative">
        
        {/* Contenedor relativo que define exactamente el área donde se dibujarán las barras (dejando espacio para el texto de la derecha) */}
        <div className="relative pt-6 mr-14">
          
          {/* Línea vertical de la media - Ahora es absoluta respecto a la "pista" de las barras, no a la pantalla entera */}
          <div 
            className="absolute top-0 bottom-0 border-l-2 border-gray-200 border-dashed z-0"
            style={{ left: `${(mediaCiclo / maxDiasReal) * 100}%` }}
          >
            <span className="absolute -top-1 -translate-x-1/2 text-[10px] font-bold text-gray-400 bg-white px-1 whitespace-nowrap">
              Media {mediaCiclo}
            </span>
          </div>

          <div className="space-y-6 relative z-10 mt-2">
            {ciclos.map((ciclo, index) => {
              const inicio = new Date(ciclo.fecha_inicio);
              const fechaSiguiente = index > 0 ? new Date(ciclos[index - 1].fecha_inicio) : new Date();
              const duracionCiclo = Math.round((fechaSiguiente.getTime() - inicio.getTime()) / (1000 * 3600 * 24));
              
              const fin = ciclo.fecha_fin ? new Date(ciclo.fecha_fin) : new Date();
              const duracionPeriodo = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 3600 * 24)) + 1;

              return (
                <div key={ciclo.id || index} className="relative">
                  <p className="text-xs text-gray-500 mb-1">
                    {inicio.toLocaleDateString()} - {ciclo.fecha_fin ? fin.toLocaleDateString() : 'En curso'}
                  </p>
                  
                  {/* Contenedor de la fila (Barra + Texto) */}
                  <div className="flex items-center gap-2">
                    
                    {/* Contenedor de la "pista" que ocupa el 100% del área dibujable */}
                    <div className="w-full relative h-6">
                      {/* La barra gris real. Usamos 'width' puro, no 'flex-grow', para forzar la proporción matemática */}
                      <div 
                        className="h-full bg-gray-200 rounded-full overflow-hidden absolute top-0 left-0" 
                        style={{ width: `${(duracionCiclo / maxDiasReal) * 100}%`, minWidth: '20px' }}
                      >
                        {/* La barra rosa del periodo */}
                        <div 
                          className="h-full bg-pink-400 rounded-full" 
                          style={{ width: `${(duracionPeriodo / duracionCiclo) * 100}%` }}
                        >
                        </div>
                      </div>
                    </div>

                    {/* Texto de días posicionado absolutamente fuera de la pista para no interferir con las matemáticas de los anchos */}
                    <span className="text-sm font-semibold text-purple-900 w-12 shrink-0 absolute -right-14">
                      {duracionCiclo} días
                    </span>
                    
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};