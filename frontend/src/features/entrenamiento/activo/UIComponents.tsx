import React from 'react';
import { X } from 'lucide-react';
import { type RutinaRealizacionDetalle } from '../RutinaForm';
import { type SetHistorial } from './useEntrenamiento';

export const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    const playTone = (start: number, dur: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + start + 0.02);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime + start + dur - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    playTone(0.0, 0.15, 880); 
    playTone(0.3, 0.15, 880); 
    playTone(0.6, 0.15, 880); 
    playTone(0.9, 0.60, 1200); 
  } catch (e) { console.warn("Audio bloqueado", e); }
};

interface BarraProgresoProps {
  ejercicios: RutinaRealizacionDetalle[];
  historial: SetHistorial[];
  currentIndex: number;
}

export const BarraProgreso: React.FC<BarraProgresoProps> = ({ ejercicios, historial, currentIndex }) => {
  return (
    <div className="w-full flex gap-1.5 px-2 py-1">
      {ejercicios.map((ej, idx) => {
        // Usamos rutina_realizacion_id (ej.id) para que ejercicios repetidos tengan su propia barra independiente
        const done = historial.filter(h => h.rutina_realizacion_id === ej.id).length;
        const total = ej.series || 1;
        const isCompleted = done >= total;
        const isActive = idx === currentIndex;
        
        let bgColor = 'bg-slate-700/50'; 
        if (isActive) bgColor = 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'; 
        else if (isCompleted) bgColor = 'bg-emerald-500';

        return <div key={`${ej.id}-${idx}`} className={`h-1.5 flex-1 rounded-full ${bgColor} transition-all duration-300`} />;
      })}
    </div>
  );
};

export const ModalListadoRutina: React.FC<{ isOpen: boolean, onClose: () => void, state: any, actions: any }> = ({ isOpen, onClose, state, actions }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-md flex justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-lg rounded-[2rem] p-6 flex flex-col max-h-[85vh] shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-2xl text-white">Tu Rutina</h3>
          <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors text-slate-300"><X className="w-6 h-6"/></button>
        </div>
        <div className="overflow-y-auto space-y-3 custom-scrollbar flex-1 pr-2 pb-4">
          {state.ejerciciosPlanificados.map((ej: RutinaRealizacionDetalle, idx: number) => {
            const setsHechos = state.historial.filter((h: SetHistorial) => h.rutina_realizacion_id === ej.id).length;
            const total = ej.series || 1;
            const isCompleted = setsHechos >= total;
            const isActive = idx === state.currentExerciseIndex;

            return (
              <button key={`${ej.id}-${idx}`} onClick={() => { actions.jumpToExercise(idx); onClose(); }} className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all border ${isActive ? 'border-indigo-500 bg-indigo-500/10' : isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-700 hover:border-slate-500'}`}>
                {ej.ejercicio_imagen ? <img src={ej.ejercicio_imagen} className="w-14 h-14 rounded-xl object-cover bg-black/50" /> : <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700"><span className="text-slate-500 font-bold">{idx + 1}</span></div>}
                <div className="flex-1">
                  <p className="font-bold text-white line-clamp-1">{ej.ejercicio_nombre}</p>
                  <p className={`text-sm font-medium mt-0.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>{setsHechos} / {total} series</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};