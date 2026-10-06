import React, { useState, useEffect } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import { useEntrenamiento } from "./useEntrenamiento";
import { PasoSeleccion } from "./pasos/PasoSeleccion";
import { PasoResumenInicial } from "./pasos/PasoResumenInicial";
import { PasoEntrenando } from "./pasos/PasoEntrenando";
import { PasoDescanso } from "./pasos/PasoDescanso";
import { PasoFinalizado } from "./pasos/PasoFinalizado";

export const getPhaseTheme = (fase: string) => {
  switch (fase) {
    case "Calentamiento":
      return {
        text: "text-orange-400",
        stroke: "stroke-orange-400",
        textLight: "text-orange-300",
        bg: "bg-orange-600",
        bgHover: "hover:bg-orange-500",
        bgTransparent: "bg-orange-900/30",
        border: "border-orange-400/50",
        borderDim: "border-orange-500/30",
        shadow: "shadow-[0_0_30px_rgba(249,115,22,0.3)]",
        shadowLg: "shadow-[0_0_80px_rgba(249,115,22,0.15)]",
        badgeBg: "bg-orange-600/90",
      };
    case "Postentreno":
      return {
        text: "text-cyan-400",
        stroke: "stroke-cyan-400",
        textLight: "text-cyan-300",
        bg: "bg-cyan-600",
        bgHover: "hover:bg-cyan-500",
        bgTransparent: "bg-cyan-900/30",
        border: "border-cyan-400/50",
        borderDim: "border-cyan-500/30",
        shadow: "shadow-[0_0_30px_rgba(6,182,212,0.3)]",
        shadowLg: "shadow-[0_0_80px_rgba(6,182,212,0.15)]",
        badgeBg: "bg-cyan-600/90",
      };
    default:
      return {
        text: "text-indigo-400",
        stroke: "stroke-indigo-400",
        textLight: "text-indigo-300",
        bg: "bg-indigo-600",
        bgHover: "hover:bg-indigo-500",
        bgTransparent: "bg-indigo-900/30",
        border: "border-indigo-400/50",
        borderDim: "border-indigo-500/30",
        shadow: "shadow-[0_0_30px_rgba(79,70,229,0.3)]",
        shadowLg: "shadow-[0_0_80px_rgba(79,70,229,0.15)]",
        badgeBg: "bg-indigo-600/90",
      };
  }
};

interface EntrenamientoActivoProps {
  onClose: () => void;
}

export const EntrenamientoActivo: React.FC<EntrenamientoActivoProps> = ({
  onClose,
}) => {
  const [showAbortModal, setShowAbortModal] = useState(false);
  const { state, actions } = useEntrenamiento(onClose);

  // LÓGICA DE TÍTULO DINÁMICO
  let headerTitle = "Entrenamiento Activo";
  if (
    (state.step === "WORKOUT" || state.step === "REST") &&
    state.ejerciciosPlanificados.length > 0
  ) {
    const ejActual = state.ejerciciosPlanificados[state.currentExerciseIndex];
    if (ejActual && ejActual.fase) {
      headerTitle = ejActual.fase;
    }
  }

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state.step !== "WORKOUT" && state.step !== "REST") return;
    if (!state.startTime) return;
    const int = setInterval(() => {
      setElapsed(Math.floor((Date.now() - state.startTime) / 1000));
    }, 1000);
    return () => clearInterval(int);
  }, [state.step, state.startTime]);

  const totalSeries = state.ejerciciosPlanificados.reduce(
    (acc: number, ej: any) => acc + (ej.series || 1),
    0,
  );
  const completedSeries = state.historial.length;

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center overflow-y-auto overflow-x-hidden">
        {/* Cabecera Global */}
        {state.step !== "FINISHED" && (
          <div className="w-full max-w-3xl px-4 py-2 flex justify-between items-center bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md">
            <button
              onClick={() => setShowAbortModal(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shadow-sm w-10 flex justify-center items-center"
            >
              <X className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
            </button>

            <div className="flex flex-col items-center justify-center flex-1">
              <span className="font-black text-lg text-slate-200">
                {headerTitle}
              </span>
              {(state.step === "WORKOUT" || state.step === "REST") && (
                <span className="text-xs font-bold text-slate-400 mt-0.5">
                  {formatElapsed(elapsed)} • {completedSeries}/{totalSeries}{" "}
                  Series
                </span>
              )}
            </div>

            {state.step === "WORKOUT" || state.step === "REST" ? (
              <button
                onClick={actions.finishWorkoutEarly}
                className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 rounded-xl transition-colors shadow-sm w-10 flex justify-center items-center"
              >
                <Check className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
              </button>
            ) : (
              <div className="w-10"></div>
            )}
          </div>
        )}

        {/* MÁQUINA DE ESTADOS */}
        {state.step === "SELECT_RUTINA" && (
          <PasoSeleccion state={state} actions={actions} />
        )}
        {state.step === "PREVIEW" && (
          <PasoResumenInicial state={state} actions={actions} />
        )}
        {state.step === "WORKOUT" && (
          <PasoEntrenando state={state} actions={actions} />
        )}
        {state.step === "REST" && (
          <PasoDescanso state={state} actions={actions} />
        )}
        {state.step === "FINISHED" && (
          <PasoFinalizado state={state} actions={actions} />
        )}

        {/* MODAL INTEGRADO DE CANCELACIÓN */}
        {showAbortModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900">
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                  <AlertTriangle
                    className="w-8 h-8 text-rose-500"
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="text-2xl font-black mb-2">¿Seguro que sales?</h3>
                <p className="text-slate-500 font-medium">
                  Se perderá todo el progreso de la sesión actual y no se
                  guardará en el historial.
                </p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button
                  onClick={() => setShowAbortModal(false)}
                  className="flex-1 px-4 py-3 font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                >
                  Continuar
                </button>
                <button
                  onClick={() => {
                    setShowAbortModal(false);
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors shadow-sm"
                >
                  Sí, Salir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};