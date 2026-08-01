import { useState, useEffect } from 'react';
import { type Rutina, type RutinaRealizacionDetalle } from '../RutinaForm';

export interface SetHistorial {
  rutina_realizacion_id: string;
  realizacion_id: string;
  ejercicio_id: string;
  ejercicio_nombre: string;
  fase: string;
  orden_ejercicio: number;
  serie_numero: number;
  reps_completadas: number | null;
  unidad_objetivo: string;
  carga_completada: number | null;
  unidad_carga: string | null;
}

export type Step = 'SELECT_RUTINA' | 'PREVIEW' | 'WORKOUT' | 'REST' | 'FINISHED';

export const useEntrenamiento = (onClose: () => void) => {
  const [step, setStep] = useState<Step>('SELECT_RUTINA');
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [selectedRutina, setSelectedRutina] = useState<Rutina | null>(null);
  
  const [ejerciciosPlanificados, setEjerciciosPlanificados] = useState<RutinaRealizacionDetalle[]>([]);
  const [historial, setHistorial] = useState<SetHistorial[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetch('/api/rutinas').then(res => res.json()).then(setRutinas).catch(console.error);
  }, []);

  const actions = {
    selectRutina: async (rutina: Rutina) => {
      try {
        const res = await fetch(`/api/rutinas/${rutina.id}/realizaciones`);
        const detalles: RutinaRealizacionDetalle[] = await res.json();
        
        const ejerciciosActivos = detalles.filter(d => d.realizacion_activa !== false);
        setEjerciciosPlanificados(ejerciciosActivos);
        setSelectedRutina(rutina);
        setStep('PREVIEW');
      } catch (e) {
        console.error(e);
      }
    },
    
    goBackToSelect: () => setStep('SELECT_RUTINA'),
    
    startWorkout: () => {
      setStartTime(Date.now());
      setCurrentExerciseIndex(0);
      setStep('WORKOUT');
    },

    completeSet: (reps: string, carga: string) => {
      const current = ejerciciosPlanificados[currentExerciseIndex];
      const setsHechos = historial.filter(h => h.rutina_realizacion_id === current.id).length;
      const currentSerie = setsHechos + 1;

      const newSet: SetHistorial = {
        rutina_realizacion_id: current.id,
        realizacion_id: current.realizacion_id,
        ejercicio_id: current.ejercicio_id,
        ejercicio_nombre: current.ejercicio_nombre,
        fase: current.fase,
        orden_ejercicio: current.orden,
        serie_numero: currentSerie,
        reps_completadas: reps ? parseInt(reps) : null,
        unidad_objetivo: current.unidad_objetivo || 'reps',
        carga_completada: carga ? parseFloat(carga) : null,
        unidad_carga: current.unidad_carga
      };

      const newHistorial = [...historial, newSet];
      setHistorial(newHistorial);

      const totalPlanned = current.series || 1;
      const isLastSetOfExercise = currentSerie >= totalPlanned;
      const desc = isLastSetOfExercise ? current.descanso_posterior : current.descanso;

      if (desc && desc > 0) {
        setTimeLeft(desc);
        setStep('REST');
      } else {
        actions.advanceAfterRest(newHistorial, isLastSetOfExercise);
      }
    },

    advanceAfterRest: (currentHist: SetHistorial[], wasLastSet: boolean) => {
      if (!wasLastSet) {
        setStep('WORKOUT');
      } else {
        let nextIndex = currentExerciseIndex + 1;
        if (nextIndex >= ejerciciosPlanificados.length) {
          nextIndex = ejerciciosPlanificados.findIndex(ej => {
            const done = currentHist.filter(h => h.rutina_realizacion_id === ej.id).length;
            return done < (ej.series || 1);
          });
        }
        
        if (nextIndex === -1) {
          setStep('FINISHED');
        } else {
          setCurrentExerciseIndex(nextIndex);
          setStep('WORKOUT');
        }
      }
    },

    tickTimer: () => setTimeLeft(prev => prev - 1),
    
    skipRest: () => {
      const current = ejerciciosPlanificados[currentExerciseIndex];
      const setsHechos = historial.filter(h => h.rutina_realizacion_id === current.id).length;
      const totalPlanned = current.series || 1;
      actions.advanceAfterRest(historial, setsHechos >= totalPlanned);
    },

    jumpToExercise: (index: number) => {
      setCurrentExerciseIndex(index);
      setStep('WORKOUT');
    },

    // NUEVA ACCIÓN: Finaliza el entrenamiento prematuramente
    finishWorkoutEarly: () => {
      if (historial.length === 0) {
        alert("No has completado ninguna serie. Si quieres salir, usa la X de arriba a la derecha.");
        return;
      }
      setStep('FINISHED');
    },

    saveWorkout: async () => {
      if (!selectedRutina) return;
      const payload = {
        rutina_id: selectedRutina.id,
        nombre: selectedRutina.nombre,
        fecha_inicio: new Date(startTime).toISOString(),
        fecha_fin: new Date().toISOString(),
        duracion_segundos: Math.floor((Date.now() - startTime) / 1000),
        series: historial
      };

      try {
        const res = await fetch('/api/historial-rutinas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'historial' }));
        onClose();
      } catch (e) {
        console.error(e);
        alert(`Error guardando: ${(e as Error).message}`);
      }
    }
  };

  return {
    state: { step, rutinas, selectedRutina, ejerciciosPlanificados, historial, currentExerciseIndex, startTime, timeLeft },
    actions
  };
};