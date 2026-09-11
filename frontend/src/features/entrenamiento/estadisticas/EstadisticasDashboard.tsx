import React from 'react';
import { useEstadisticas } from './useEstadisticas';
import { EstadisticasPieCharts } from './EstadisticasPieCharts';
import { EstadisticasFrecuencia } from './EstadisticasFrecuencia';
import { EstadisticasMeses } from './EstadisticasMeses';
import { EstadisticasProgresion } from './EstadisticasProgresion';
import { CalendarioSelector } from './CalendarioSelector'; // <-- NUEVO

export const EstadisticasDashboard: React.FC = () => {
  const { 
    pieDays, 
    setPieDays, 
    pieChartsData, 
    entrenosPorMes, 
    diasSemanaStats, 
    progresionEjercicios,
    calendarioRutinas
  } = useEstadisticas();

  // ... (El bloque de isLoading se queda igual) ...

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN 1: PIE CHARTS Y DÍAS DE LA SEMANA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <EstadisticasPieCharts data={pieChartsData} pieDays={pieDays} setPieDays={setPieDays} />
        <div className="xl:col-span-1">
          <EstadisticasFrecuencia stats={diasSemanaStats} />
        </div>
      </div>

      {/* SECCIÓN 2: CALENDARIO INTERACTIVO (NUEVO) */}
      <CalendarioSelector calendarioRutinas={calendarioRutinas} />

      {/* SECCIÓN 3: GRÁFICA MESES */}
      <EstadisticasMeses data={entrenosPorMes} />

      {/* SECCIÓN 4: TABLA DE PROGRESIÓN */}
      <EstadisticasProgresion data={progresionEjercicios} />
      
    </div>
  );
};