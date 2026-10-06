import { useState, useEffect } from "react";
import {
  Play,
  Timer,
  CheckCircle2,
  Trophy,
  Dumbbell,
  FastForward,
  List,
  Flag,
  RotateCcw,
  Pause,
  SkipForward,
  Info,
  Plus,
  Minus,
} from "lucide-react";
import { ModalListadoRutina, playBeep, BarraProgreso } from "./UIComponents";
import { Button } from "../../../components/ui/Button";

const getPhaseTheme = (fase: string) => {
  switch (fase) {
    case "Calentamiento":
      return {
        text: "text-orange-400",
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

export const PasoSeleccion = ({ state, actions }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const rutinasActivas = state.rutinas.filter((r: any) => r.activo !== false);

  const handleSelect = async (r: any) => {
    setIsLoading(true);
    try {
      await actions.selectRutina(r);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-lg p-6 flex-1 flex flex-col items-center justify-center mt-8 animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-800/90 backdrop-blur-md p-10 rounded-[2rem] border border-slate-700 shadow-2xl flex flex-col items-center text-center">
          <svg
            className="w-16 h-16 text-indigo-500 animate-spin mb-6"
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
          <h2 className="text-2xl font-black text-white mb-2">
            Cargando rutina
          </h2>
          <p className="text-slate-400 font-medium">
            Preparando los ejercicios planificados...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg p-6 space-y-6 flex-1 flex flex-col mt-8">
      <h1 className="text-3xl font-black mb-4 text-center">¿Qué toca hoy?</h1>
      {rutinasActivas.length === 0 ? (
        <div className="p-6 bg-slate-800 rounded-2xl text-center text-slate-400">
          No hay rutinas activas.
        </div>
      ) : (
        <div className="space-y-4">
          {rutinasActivas.map((r: any) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center justify-between p-5 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700 hover:border-indigo-500 group text-left"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-12 rounded-full shadow-sm"
                  style={{ backgroundColor: r.color || "#4f46e5" }}
                />
                <div>
                  <h3 className="text-xl font-bold text-white">{r.nombre}</h3>
                  {r.descripcion && (
                    <p className="text-slate-400 text-sm mt-1">
                      {r.descripcion}
                    </p>
                  )}
                </div>
              </div>
              <Play
                className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors"
                fill="currentColor"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const PasoResumenInicial = ({ state, actions }: any) => {
  const [isStarting, setIsStarting] = useState(false);
  const fasesOrder = ["Calentamiento", "Principal", "Postentreno"];

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
                  const targetText = isSeg
                    ? `${ej.reps_min || "?"} seg`
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

export const PasoEntrenando = ({ state, actions }: any) => {
  const [showList, setShowList] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const ej = state.ejerciciosPlanificados[state.currentExerciseIndex];

  const setsHechos = state.historial.filter(
    (h: any) => h.rutina_realizacion_id === ej.id,
  ).length;
  const currentSerie = setsHechos + 1;
  const totalSeries = ej.series || 1;

  const isTimeBased =
    ej.unidad_objetivo === "seg" || ej.unidad_objetivo === "min";

  const [carga, setCarga] = useState("");
  const [reps, setReps] = useState("");

  const [timeMode, setTimeMode] = useState<"prep" | "active">("prep");
  const [isPaused, setIsPaused] = useState(false);
  const [timerValue, setTimerValue] = useState(5);

  const theme = getPhaseTheme(ej.fase);

  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);

  useEffect(() => {
    setCarga(ej.carga_actual?.toString() || "");
    if (isTimeBased) {
      setTimeMode("prep");
      setIsPaused(false);
      setTimerValue(5);
      setTargetEndTime(Date.now() + 5000);
    } else {
      setReps(ej.reps_min?.toString() || "");
    }
  }, [ej.id, currentSerie, isTimeBased]);

  useEffect(() => {
    if (!isTimeBased || isPaused || !targetEndTime) return;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
      setTimerValue(left);

      if (left === 0) {
        if (timeMode === "prep") {
          playBeep();
          setTimeMode("active");
          const activeTime =
            ej.unidad_objetivo === "min"
              ? (ej.reps_min || 0) * 60
              : ej.reps_min || 0;
          setTimerValue(activeTime);
          setTargetEndTime(Date.now() + activeTime * 1000);
        } else if (timeMode === "active") {
          playBeep();
          actions.completeSet(ej.reps_min?.toString() || "0", carga);
        }
      }
    };

    const intervalId = setInterval(tick, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    isTimeBased,
    isPaused,
    targetEndTime,
    timeMode,
    ej.unidad_objetivo,
    ej.reps_min,
    carga,
  ]);

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setTargetEndTime(Date.now() + timerValue * 1000);
    } else {
      setIsPaused(true);
      setTargetEndTime(null);
    }
  };

  const restartTimer = () => {
    setTimeMode("prep");
    setIsPaused(false);
    setTimerValue(5);
    setTargetEndTime(Date.now() + 5000);
  };

  const formatDisplayTime = (secs: number) => {
    if (timeMode === "prep" || ej.unidad_objetivo === "seg") return secs;
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getStrokeDashoffset = () => {
    const totalTime =
      timeMode === "prep"
        ? 5
        : ej.unidad_objetivo === "min"
          ? (ej.reps_min || 0) * 60
          : ej.reps_min || 0;
    if (totalTime === 0) return 0;
    const progressPercent = (timerValue / totalTime) * 100;
    const strokeDasharray = 2 * Math.PI * 40;
    return strokeDasharray * ((100 - progressPercent) / 100);
  };

  const nextExercise =
    state.ejerciciosPlanificados[state.currentExerciseIndex + 1];
  const nextText = nextExercise
    ? `Próximo: ${nextExercise.ejercicio_nombre}`
    : "Último ejercicio de la rutina";

  return (
    <div className="w-full flex flex-col flex-1 pb-32 animate-in slide-in-from-right-4 duration-300">
      <div className="w-full max-w-3xl mx-auto px-4 py-3 sticky top-[73px] z-20 bg-slate-900/95 backdrop-blur-md mb-2">
        <BarraProgreso
          ejercicios={state.ejerciciosPlanificados}
          historial={state.historial}
          currentIndex={state.currentExerciseIndex}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 flex flex-col mt-2">
        {/* Serie X/Y Arriba a la izquierda */}
        <div className="mb-2">
          <span className="font-bold text-sm text-slate-300">
            Serie {currentSerie} / {totalSeries}
          </span>
        </div>

        {/* Imagen Ajustada */}
        <div className="w-full flex justify-center mb-3">
          {ej.ejercicio_imagen ? (
            <img
              src={ej.ejercicio_imagen}
              className="w-full h-auto max-h-[35vh] md:max-h-[40vh] object-contain rounded-2xl opacity-95 shadow-sm"
            />
          ) : (
            <div className="w-full h-[25vh] max-w-sm flex justify-center items-center bg-slate-800/30 rounded-2xl">
              <Dumbbell className="w-16 h-16 text-slate-600" />
            </div>
          )}
        </div>

        {/* Nombre del ejercicio e Info alineado a la izquierda */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black leading-tight text-white drop-shadow-sm text-left mr-4">
            {ej.ejercicio_nombre}
          </h2>
          {ej.ejercicio_descripcion && (
            <button
              onClick={() => setShowDesc(!showDesc)}
              className="text-slate-400 hover:text-indigo-400 transition-colors bg-slate-800 p-2 rounded-full flex-shrink-0"
            >
              <Info className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Descripción Modal / Panel */}
        {showDesc && ej.ejercicio_descripcion && (
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl mb-4 text-slate-300 text-sm whitespace-pre-wrap animate-in fade-in zoom-in-95">
            {ej.ejercicio_descripcion}
          </div>
        )}

        {/* Inputs Rediseñados */}
        <div className="flex flex-col gap-4 w-full px-2 mb-2">
          {isTimeBased ? (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Temporizador Circular */}
              <div className="flex flex-col items-center justify-center relative w-28 h-28 mx-auto">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={`transition-all duration-1000 linear ${timeMode === "prep" ? "stroke-rose-500" : "stroke-indigo-500"}`}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={getStrokeDashoffset()}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${timeMode === "prep" ? "text-rose-400" : "text-indigo-400"}`}
                  >
                    {timeMode === "prep" ? "Prepárate" : "Tiempo"}
                  </span>
                  <span
                    className={`text-xl font-black tabular-nums mt-0.5 ${timeMode === "prep" ? "text-rose-500" : "text-white"}`}
                  >
                    {formatDisplayTime(timerValue)}
                  </span>
                </div>
              </div>

              {/* Peso (Igual que normal) */}
              {ej.tipo_carga !== "Sin carga" && (
                <div className="flex flex-col w-full">
                  <span className="text-sm font-bold text-slate-400 mb-1 text-left">
                    Peso ({ej.unidad_carga || "kg"})
                  </span>
                  <div className="flex items-center w-full">
                    <button
                      onClick={() =>
                        setCarga((c) =>
                          Number(c) > 0 ? (Number(c) - 1).toFixed(1) : "0",
                        )
                      }
                      className="bg-rose-900/40 text-rose-400 hover:bg-rose-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={carga}
                      onChange={(e) => setCarga(e.target.value)}
                      className="flex-1 w-full bg-slate-800 border border-slate-700 shadow-inner rounded-xl text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center mx-3 h-12"
                      placeholder="0"
                    />
                    <button
                      onClick={() =>
                        setCarga((c) => (Number(c) + 1).toFixed(1))
                      }
                      className="bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {ej.tipo_carga !== "Sin carga" && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-400 mb-1 text-left">
                    Peso ({ej.unidad_carga || "kg"})
                  </span>
                  <div className="flex items-center w-full">
                    <button
                      onClick={() =>
                        setCarga((c) =>
                          Number(c) > 0 ? (Number(c) - 1).toFixed(1) : "0",
                        )
                      }
                      className="bg-rose-900/40 text-rose-400 hover:bg-rose-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={carga}
                      onChange={(e) => setCarga(e.target.value)}
                      className="flex-1 w-full bg-slate-800 border border-slate-700 shadow-inner rounded-xl text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center mx-3 h-12"
                      placeholder="0"
                    />
                    <button
                      onClick={() =>
                        setCarga((c) => (Number(c) + 1).toFixed(1))
                      }
                      className="bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-400 mb-1 text-left">
                  Repeticiones ({ej.unidad_objetivo || "reps"})
                </span>
                <div className="flex items-center w-full">
                  <button
                    onClick={() =>
                      setReps((r) =>
                        Number(r) > 0 ? (Number(r) - 1).toString() : "0",
                      )
                    }
                    className="bg-rose-900/40 text-rose-400 hover:bg-rose-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="flex-1 w-full bg-slate-800 border border-slate-700 shadow-inner rounded-xl text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center mx-3 h-12"
                    placeholder="0"
                  />
                  <button
                    onClick={() => setReps((r) => (Number(r) + 1).toString())}
                    className="bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-400">{nextText}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 px-4 py-3 z-30 flex items-center gap-2 pointer-events-auto">
        <Button
          className="w-1/3"
          colorTheme={{
            bgNormal: "bg-slate-800",
            bgHover: "hover:bg-slate-700",
            textColor: "text-slate-200",
            border: "border-slate-700",
            focusRing: "focus:ring-indigo-500",
          }}
          onClick={() => setShowList(true)}
        >
          Rutina
        </Button>

        {isTimeBased ? (
          <div className="w-2/3 flex gap-2 items-center justify-end">
            <button
              onClick={restartTimer}
              className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex-shrink-0"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={togglePause}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-lg ${
                isPaused
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              }`}
            >
              {isPaused ? (
                <Play className="w-5 h-5 ml-1" fill="currentColor" />
              ) : (
                <Pause className="w-5 h-5" fill="currentColor" />
              )}
            </button>
            <Button
              variant="success"
              className="flex-1 ml-1"
              onClick={() =>
                actions.completeSet(ej.reps_min?.toString() || "0", carga)
              }
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <Button
            className="w-2/3"
            colorTheme={{
              bgNormal: theme.bg,
              bgHover: theme.bgHover,
              focusRing: "focus:ring-indigo-500",
              textColor: "text-white",
            }}
            onClick={() => actions.completeSet(reps, carga)}
          >
            Completar Serie
          </Button>
        )}
      </div>

      <ModalListadoRutina
        isOpen={showList}
        onClose={() => setShowList(false)}
        state={state}
        actions={actions}
      />
    </div>
  );
};
export const PasoDescanso = ({ state, actions }: any) => {
  const [endTime] = useState(() => Date.now() + state.timeLeft * 1000);
  const [displayTime, setDisplayTime] = useState(state.timeLeft);

  useEffect(() => {
    if (state.timeLeft <= 0) {
      playBeep();
      actions.skipRest();
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setDisplayTime(remaining);
      if (remaining === 0) {
        playBeep();
        actions.skipRest();
      }
    };

    const timer = setInterval(tick, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [endTime]);

  const nextExercise = state.ejerciciosPlanificados[state.currentExerciseIndex];
  const nextText = nextExercise
    ? `Próximo: ${nextExercise.ejercicio_nombre}`
    : "Último ejercicio de la rutina";

  const theme = getPhaseTheme(nextExercise?.fase || "Principal");

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

        <div className="relative flex items-center justify-center">
          <div
            className={`w-72 h-72 rounded-full border-[12px] border-slate-800 flex items-center justify-center ${theme.shadowLg}`}
          >
            <span
              className={`text-8xl font-black tracking-tighter ${theme.text} drop-shadow-md`}
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
          <button
            onClick={actions.finishWorkoutEarly}
            className="text-slate-400 hover:text-rose-400 font-bold px-4 py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <Flag className="w-5 h-5" /> Finalizar Entrenamiento
          </button>
        </div>
      </div>
    </div>
  );
};

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
