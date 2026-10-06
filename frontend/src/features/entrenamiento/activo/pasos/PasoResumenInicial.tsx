import { useState } from "react";
import {
  Play,
  Dumbbell,
} from "lucide-react";
import { calculateEstimatedTime } from "../../../../utils/ejerciciosCalculations";

export const PasoResumenInicial = ({ state, actions }: any) => {
  const [isStarting, setIsStarting] = useState(false);
  const fasesOrder = ["Calentamiento", "Principal", "Postentreno"];
  const tiempoMedio = calculateEstimatedTime(state.ejerciciosPlanificados);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await actions.startWorkout();
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl flex-1 flex flex-col mt-4 px-4 pb-32 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">
          {state.selectedRutina?.nombre}
        </h1>
        <p className="text-indigo-400 font-bold mt-3 uppercase tracking-widest text-sm">
          {state.ejerciciosPlanificados.length} ejercicios planificados
        </p>
        <p className="text-slate-400 font-medium mt-1">
          Tiempo estimado: {tiempoMedio} min
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {fasesOrder.map((faseNombre) => {
          const ejerciciosFase = state.ejerciciosPlanificados
            .map((ej: any, idx: number) => ({ ej, idx }))
            .filter((item: any) => item.ej.fase === faseNombre);

          if (ejerciciosFase.length === 0) return null;

          let titleColor = "text-indigo-400";
          if (faseNombre === "Calentamiento") titleColor = "text-orange-400";
          if (faseNombre === "Postentreno") titleColor = "text-cyan-400";

          return (
            <div key={faseNombre} className="mb-8 last:mb-0">
              <h3
                className={`text-sm font-black uppercase tracking-widest mb-4 ml-2 ${titleColor}`}
              >
                {faseNombre}
              </h3>
              <div className="space-y-4">
                {ejerciciosFase.map(({ ej, idx }: any) => {
                  const isSeg = ej.unidad_objetivo === "seg";
                  const isMin = ej.unidad_objetivo === "min";
                  const targetText = isSeg
                    ? `${ej.reps_min || "?"} seg`
                    : isMin
                      ? `${ej.reps_min || "?"} min`
                      : `${ej.reps_min || "?"}${ej.reps_max && ej.reps_max !== ej.reps_min ? ` - ${ej.reps_max}` : ""} reps`;

                  return (
                    <div
                      key={`${ej.id}-${idx}`}
                      className="p-4 bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center gap-5 border border-slate-700/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-black text-slate-400 flex-shrink-0">
                        {idx + 1}
                      </div>
                      {ej.ejercicio_imagen ? (
                        <img
                          src={ej.ejercicio_imagen}
                          className="w-20 h-20 rounded-xl object-cover bg-black/50 shadow-inner"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center">
                          <Dumbbell className="w-10 h-10 text-slate-600" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xl text-white leading-tight">
                          {ej.ejercicio_nombre}
                        </h4>
                        <p className="text-slate-400 font-medium mt-1.5">
                          {ej.series || 1} series × {targetText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent flex gap-4 justify-center pointer-events-none z-10">
        <button
          onClick={actions.goBackToSelect}
          className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 transition-colors pointer-events-auto shadow-lg border border-slate-700"
        >
          Atrás
        </button>
        <button
          onClick={handleStart}
          disabled={state.ejerciciosPlanificados.length === 0 || isStarting}
          className="flex-1 max-w-md py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xl font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-transform active:scale-95 pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <svg
              className="w-6 h-6 animate-spin flex-shrink-0 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <Play fill="currentColor" className="w-6 h-6" />
          )}
          {state.ejerciciosPlanificados.length === 0
            ? "No hay ejercicios activos"
            : isStarting
              ? "Preparando..."
              : "Empezar Rutina"}
        </button>
      </div>
    </div>
  );
};
