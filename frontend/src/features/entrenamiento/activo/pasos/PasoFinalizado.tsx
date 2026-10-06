import { useState } from "react";
import {
  CheckCircle2,
  Trophy,
  RotateCcw,
} from "lucide-react";

export const PasoFinalizado = ({ state, actions }: any) => {
  const [isSaving, setIsSaving] = useState(false);

  // Lógica para detectar si faltan ejercicios por hacer
  const hasUnfinishedExercises = state.ejerciciosPlanificados.some(
    (ej: any) => {
      const setsHechos = state.historial.filter(
        (h: any) => h.rutina_realizacion_id === ej.id,
      ).length;
      const totalPlanned = ej.series || 1;
      return setsHechos < totalPlanned;
    },
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await actions.saveWorkout();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const agrupados = state.ejerciciosPlanificados
    .map((ej: any) => ({
      ejercicio: ej,
      series: state.historial.filter(
        (h: any) => h.rutina_realizacion_id === ej.id,
      ),
    }))
    .filter((g: any) => g.series.length > 0);

  return (
    <div className="w-full flex-1 flex flex-col items-center p-6 pb-32 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
        <Trophy className="w-12 h-12 text-emerald-400" />
      </div>
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">
          ¡Completado!
        </h1>
        <p className="text-xl text-slate-400">
          Has machacado la rutina{" "}
          <span className="text-emerald-400 font-bold">
            {state.selectedRutina?.nombre}
          </span>
        </p>
      </div>

      <div className="w-full max-w-2xl flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {agrupados.map((grupo: any, idx: number) => (
          <div
            key={`${grupo.ejercicio.id}-${idx}`}
            className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-lg"
          >
            <h4 className="font-black text-xl text-white mb-4 leading-tight">
              {grupo.ejercicio.ejercicio_nombre}
            </h4>
            <div className="space-y-2">
              {grupo.series.map((s: any) => (
                <div
                  key={s.serie_numero}
                  className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800"
                >
                  <span className="text-slate-400 font-bold text-sm">
                    Serie {s.serie_numero}
                  </span>
                  <span className="font-black text-lg text-indigo-300">
                    {s.carga_completada || 0}{" "}
                    <span className="text-sm font-medium text-indigo-400/70">
                      {s.unidad_carga || "kg"}
                    </span>{" "}
                    × {s.reps_completadas || 0}{" "}
                    <span className="text-sm font-medium text-indigo-400/70">
                      {s.unidad_objetivo || "reps"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent flex gap-3 justify-center z-20 pointer-events-none">
        {/* BOTÓN VOLVER (Solo visible si hay ejercicios incompletos) */}
        {hasUnfinishedExercises && (
          <button
            onClick={actions.resumeWorkout}
            disabled={isSaving}
            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-lg font-bold text-slate-300 transition-colors shadow-lg border border-slate-700 pointer-events-auto active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-5 h-5" /> Volver
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 max-w-sm py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xl font-black flex items-center justify-center gap-3 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.3)] pointer-events-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <svg
              className="w-7 h-7 animate-spin flex-shrink-0 text-white"
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
            <CheckCircle2 className="w-7 h-7" />
          )}
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
};
