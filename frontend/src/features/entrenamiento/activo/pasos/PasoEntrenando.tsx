import { useState, useEffect } from "react";
import {
  Play,
  Dumbbell,
  RotateCcw,
  Pause,
  SkipForward,
  Info,
  Plus,
  Minus,
} from "lucide-react";
import { ModalListadoRutina, playBeep, BarraProgreso } from "../UIComponents";
import { Button } from "../../../../components/ui/Button";
import { getPhaseTheme } from "../EntrenamientoActivo";
import { useBackgroundTimer } from "../hooks";

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

  const incrementCarga = (amount: number) => {
    setCarga((c: string) => {
      let val = Number(c);
      let newVal = val + amount;
      if (newVal < 0) newVal = 0;

      const tipo = ej.unidad_carga?.toLowerCase() || "";
      if (tipo.includes("banda")) {
        return Math.round(newVal).toString();
      }
      if (tipo === "kg") {
        return (Math.round(newVal * 10) / 10).toFixed(1);
      }
      return (Math.round(newVal * 10) / 10).toString();
    });
  };

  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [fluidProgress, setFluidProgress] = useState(100);

  useEffect(() => {
    let initialCarga = ej.carga_actual || 0;
    const tipo = ej.unidad_carga?.toLowerCase() || "";
    if (tipo === "kg") {
      setCarga(Number(initialCarga).toFixed(1));
    } else {
      setCarga(initialCarga.toString());
    }

    if (isTimeBased) {
      setTimeMode("prep");
      setIsPaused(false);
      setTimerValue(5);
      setTargetEndTime(Date.now() + 5000);
      setFluidProgress(100);
    } else {
      setReps(ej.reps_min?.toString() || "");
    }
  }, [ej.id, currentSerie, isTimeBased]);

  const updateTime = () => {
    if (!isTimeBased || isPaused || !targetEndTime) return;
    const now = Date.now();
    const leftMs = Math.max(0, targetEndTime - now);
    const leftSecs = Math.ceil(leftMs / 1000);

    setTimerValue(leftSecs);

    const totalTime =
      timeMode === "prep"
        ? 5
        : ej.unidad_objetivo === "min"
          ? (ej.reps_min || 0) * 60
          : ej.reps_min || 0;
    if (totalTime > 0) {
      setFluidProgress((leftMs / (totalTime * 1000)) * 100);
    }

    if (leftMs === 0) {
      if (timeMode === "prep") {
        playBeep();
        setTimeMode("active");
        const activeTime =
          ej.unidad_objetivo === "min"
            ? (ej.reps_min || 0) * 60
            : ej.reps_min || 0;
        setTimerValue(activeTime);
        setTargetEndTime(Date.now() + activeTime * 1000);
        setFluidProgress(100);
      } else if (timeMode === "active") {
        playBeep();
        actions.completeSet(ej.reps_min?.toString() || "0", carga);
      }
    }
  };

  useBackgroundTimer(
    updateTime,
    Boolean(isTimeBased && !isPaused && targetEndTime),
    250,
  );

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
    setFluidProgress(100);
  };

  const formatDisplayTime = (secs: number) => {
    if (timeMode === "prep" || ej.unidad_objetivo === "seg") return secs;
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getStrokeDashoffset = () => {
    const strokeDasharray = 2 * Math.PI * 40;
    return strokeDasharray * ((100 - fluidProgress) / 100);
  };

  const nextExercise =
    state.ejerciciosPlanificados[state.currentExerciseIndex + 1];
  const nextText = nextExercise
    ? `Próximo: ${nextExercise.ejercicio_nombre}`
    : "Último ejercicio de la rutina";

  return (
    <div className="w-full flex flex-col flex-1 pb-24 animate-in slide-in-from-right-4 duration-300">
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
        <div className="flex items-center justify-between mb-2">
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

        {/* Etiquetas Informativas */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ej.equipamiento_nombre && (
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
              {ej.equipamiento_nombre}
            </span>
          )}
          {ej.unidad_carga && (
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
              {ej.unidad_carga.toLowerCase() === "sin carga" ||
              ej.unidad_carga.toLowerCase() === "peso corporal"
                ? ej.unidad_carga
                : `${ej.carga_actual ?? 0} ${ej.unidad_carga}`}
            </span>
          )}
          {(ej.reps_min || ej.reps_max) && (
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
              {ej.reps_min || "?"}{" "}
              {ej.reps_max && ej.reps_max !== ej.reps_min
                ? `- ${ej.reps_max}`
                : ""}{" "}
              {ej.unidad_objetivo || "reps"}
            </span>
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
              <div className="flex flex-col items-center justify-center relative w-36 h-36 mx-auto">
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
                    className={`${timeMode === "prep" ? "stroke-rose-500" : "stroke-indigo-500"}`}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={getStrokeDashoffset()}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-widest ${timeMode === "prep" ? "text-rose-400" : "text-indigo-400"}`}
                  >
                    {timeMode === "prep" ? "Prepárate" : "Tiempo"}
                  </span>
                  <span
                    className={`text-2xl font-black tabular-nums mt-0.5 ${timeMode === "prep" ? "text-rose-500" : "text-white"}`}
                  >
                    {formatDisplayTime(timerValue)}
                  </span>
                </div>
              </div>

              {/* Peso (Igual que normal) */}
              <div className="flex flex-col w-full">
                <span className="text-sm font-bold text-slate-400 mb-1 text-left">
                  Peso ({ej.unidad_carga || "kg"})
                </span>
                <div className="flex items-center w-full">
                  <button
                    onClick={() => incrementCarga(-1)}
                    className="bg-rose-900/40 text-rose-400 hover:bg-rose-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={carga}
                    onChange={(e) => setCarga(e.target.value)}
                    className="flex-1 w-full bg-slate-800 border border-slate-700 shadow-inner rounded-xl text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center mx-3 h-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="0"
                  />
                  <button
                    onClick={() => incrementCarga(1)}
                    className="bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-400 mb-1 text-left">
                  Peso ({ej.unidad_carga || "kg"})
                </span>
                <div className="flex items-center w-full">
                  <button
                    onClick={() => incrementCarga(-1)}
                    className="bg-rose-900/40 text-rose-400 hover:bg-rose-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={carga}
                    onChange={(e) => setCarga(e.target.value)}
                    className="flex-1 w-full bg-slate-800 border border-slate-700 shadow-inner rounded-xl text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center mx-3 h-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="0"
                  />
                  <button
                    onClick={() => incrementCarga(1)}
                    className="bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 rounded-xl active:scale-95 transition-all flex-shrink-0 h-12 w-12 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

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
                    className="flex-1 w-full bg-slate-800 border border-slate-700 shadow-inner rounded-xl text-2xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center mx-3 h-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
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
          size="lg"
          className="w-1/3 h-10"
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
          <div className="w-2/3 flex gap-2 items-center">
            <Button
              className="px-0 flex-1 flex items-center justify-center"
              colorTheme={{
                bgNormal: "bg-slate-800",
                bgHover: "hover:bg-slate-700",
                textColor: "text-slate-300",
                border: "border-slate-700",
                focusRing: "focus:ring-indigo-500",
              }}
              onClick={restartTimer}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
            <button
              onClick={togglePause}
              className={`w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-lg ${
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
              className="px-0 flex-1 flex items-center justify-center"
              colorTheme={{
                bgNormal: "bg-slate-800",
                bgHover: "hover:bg-slate-700",
                textColor: "text-slate-300",
                border: "border-slate-700",
                focusRing: "focus:ring-indigo-500",
              }}
              onClick={() =>
                actions.completeSet(ej.reps_min?.toString() || "0", carga)
              }
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-2/3 h-10"
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
