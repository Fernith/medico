import { type RutinaRealizacionDetalle } from '../features/entrenamiento/RutinaForm';

/**
 * Calcula el tiempo estimado (en minutos) que se tardará en completar una lista de ejercicios,
 * teniendo en cuenta series, repeticiones (con tempo asumido), descansos y tiempo de preparación.
 */
export const calculateEstimatedTime = (ejercicios: RutinaRealizacionDetalle[]): number => {
  let totalSeconds = 0;
  
  ejercicios.forEach(ej => {
    // Saltamos los ejercicios que estén marcados como inactivos
    if (ej.realizacion_activa === false) return;

    const sets = ej.series || 1;
    let timePerSet = 40; // baseline por defecto
    
    if (ej.unidad_objetivo === 'seg' && ej.reps_min) {
      timePerSet = ej.reps_min;
    } else if (ej.unidad_objetivo === 'min' && ej.reps_min) {
      timePerSet = ej.reps_min * 60;
    } else {
      // Repeticiones o no especificado
      const rMin = ej.reps_min || 0;
      const rMax = ej.reps_max || rMin;
      const avgReps = (rMin + rMax) / 2;
      if (avgReps > 0) {
        timePerSet = avgReps * 4; // Asumimos ~4 segundos por repetición (tempo medio)
      }
    }

    const execTime = sets * timePerSet;
    const restBetween = Math.max(0, sets - 1) * (ej.descanso || 0);
    const restAfter = ej.descanso_posterior || 0;
    const setupTime = 20; // tiempo medio preparando el equipo / ir a la máquina
    
    totalSeconds += execTime + restBetween + restAfter + setupTime;
  });

  // Convertimos a minutos y redondeamos hacia arriba para no quedarnos cortos
  return Math.ceil(totalSeconds / 60);
};
