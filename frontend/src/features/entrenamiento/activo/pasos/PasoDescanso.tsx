import { useState, useEffect } from "react";
import { Timer, FastForward } from "lucide-react";
import { playBeep, BarraProgreso } from "../UIComponents";
import { getPhaseTheme } from "../EntrenamientoActivo";

export const PasoDescanso = ({ state, actions }: any) => {
  const [targetEndTime] = useState(() => Date.now() + state.timeLeft * 1000);
  const [displayTime, setDisplayTime] = useState(state.timeLeft);
  const [fluidProgress, setFluidProgress] = useState(100);

  useEffect(() => {
    if (!targetEndTime) return;

    let animationFrameId: number;

    const updateTime = () => {
      const now = Date.now();
      const leftMs = Math.max(0, targetEndTime - now);
      const leftSecs = Math.ceil(leftMs / 1000);

      setDisplayTime(leftSecs);

      const totalTime = state.timeLeft;
      if (totalTime > 0) {
        setFluidProgress((leftMs / (totalTime * 1000)) * 100);
      }

      if (leftMs === 0) {
        playBeep();
        actions.skipRest();
      } else {
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    animationFrameId = requestAnimationFrame(updateTime);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [targetEndTime, state.timeLeft, actions]);

  const currentEj = state.ejerciciosPlanificados[state.currentExerciseIndex];
  const setsHechos = currentEj
    ? state.historial.filter(
        (h: any) => h.rutina_realizacion_id === currentEj.id,
      ).length
    : 0;
  const totalSeries = currentEj?.series || 1;
  const isFinished = setsHechos >= totalSeries;

  let nextExerciseIndex = state.currentExerciseIndex;
  if (isFinished) {
    nextExerciseIndex += 1;
  }
  const nextExercise = state.ejerciciosPlanificados[nextExerciseIndex];
  const nextText = nextExercise
    ? `Próximo: ${nextExercise.ejercicio_nombre}`
    : "Último ejercicio de la rutina";

  const theme = getPhaseTheme(nextExercise?.fase || "Principal");

  const getStrokeDashoffset = () => {
    const strokeDasharray = 2 * Math.PI * 40;
    return strokeDasharray * ((100 - fluidProgress) / 100);
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-24 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl mx-auto px-4 py-3 sticky top-[73px] z-20 bg-slate-900/95 backdrop-blur-md mb-8 ">
        <BarraProgreso
          ejercicios={state.ejerciciosPlanificados}
          historial={state.historial}
          currentIndex={state.currentExerciseIndex}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
        <div className="text-center space-y-2">
          <Timer className={`w-12 h-12 ${theme.text} mx-auto mb-4`} />
          <h2 className="text-3xl font-black text-white drop-shadow-sm">
            Descanso
          </h2>
          <p
            className={`${theme.textLight} font-bold ${theme.bgTransparent} border ${theme.borderDim} px-5 py-2 rounded-full shadow-sm`}
          >
            {nextText}
          </p>
        </div>

        <div className="relative flex items-center justify-center w-72 h-72 mx-auto">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-slate-800"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className={`${theme.stroke}`}
              strokeWidth="4"
              fill="none"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={getStrokeDashoffset()}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-7xl font-black tabular-nums tracking-tighter ${theme.text} drop-shadow-md`}
            >
              {Math.floor(displayTime / 60)}:
              {(displayTime % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              playBeep();
              actions.skipRest();
            }}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors border border-slate-700 text-slate-300 shadow-lg"
          >
            Omitir Descanso <FastForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
