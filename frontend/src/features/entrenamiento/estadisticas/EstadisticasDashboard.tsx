import React from 'react';
import { useEstadisticas } from './useEstadisticas';
import { EstadisticasPieCharts } from './EstadisticasPieCharts';
import { EstadisticasFrecuencia } from './EstadisticasFrecuencia';
import { EstadisticasMeses } from './EstadisticasMeses';
import { EstadisticasProgresion } from './EstadisticasProgresion';

export const EstadisticasDashboard: React.FC = () => {
  const { 
    isLoading, 
    pieDays, 
    setPieDays, 
    pieChartsData, 
    entrenosPorMes, 
    diasSemanaStats, 
    progresionEjercicios 
  } = useEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN 1: PIE CHARTS Y DÍAS DE LA SEMANA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <EstadisticasPieCharts 
          data={pieChartsData} 
          pieDays={pieDays} 
          setPieDays={setPieDays} 
        />
        
        <div className="xl:col-span-1">
          <EstadisticasFrecuencia stats={diasSemanaStats} />
        </div>
      </div>

      {/* SECCIÓN 2: GRÁFICA MESES */}
      <EstadisticasMeses data={entrenosPorMes} />

      {/* SECCIÓN 3: TABLA DE PROGRESIÓN */}
      <EstadisticasProgresion data={progresionEjercicios} />
      
    </div>
  );
};