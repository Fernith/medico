import { useState, useEffect } from 'react';
import { Play, Timer, CheckCircle2, Trophy, Dumbbell, FastForward, List } from 'lucide-react';
import { ModalListadoRutina, playBeep } from './UIComponents';

export const PasoSeleccion = ({ state, actions }: any) => (
  <div className="w-full max-w-lg p-6 space-y-6 flex-1 flex flex-col mt-8">
    <h1 className="text-3xl font-black mb-4 text-center">¿Qué toca hoy?</h1>
    {state.rutinas.length === 0 ? (
      <div className="p-6 bg-slate-800 rounded-2xl text-center text-slate-400">No hay rutinas creadas.</div>
    ) : (
      <div className="space-y-4">
        {state.rutinas.map((r: any) => (
          <button key={r.id} onClick={() => actions.selectRutina(r)} className="w-full flex items-center justify-between p-5 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700 hover:border-indigo-500 group text-left">
            <div className="flex items-center gap-4">
              <div className="w-4 h-12 rounded-full shadow-sm" style={{ backgroundColor: r.color || '#4f46e5' }} />
              <div>
                <h3 className="text-xl font-bold text-white">{r.nombre}</h3>
                {r.descripcion && <p className="text-slate-400 text-sm mt-1">{r.descripcion}</p>}
              </div>
            </div>
            <Play className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="currentColor" />
          </button>
        ))}
      </div>
    )}
  </div>
);

export const PasoResumenInicial = ({ state, actions }: any) => (
  <div className="w-full max-w-3xl flex-1 flex flex-col mt-4 px-4 pb-32 animate-in fade-in duration-300">
    <div className="text-center mb-8">
      <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{state.selectedRutina?.nombre}</h1>
      <p className="text-indigo-400 font-bold mt-3 uppercase tracking-widest text-sm">{state.ejerciciosPlanificados.length} ejercicios planificados</p>
    </div>
    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
      {state.ejerciciosPlanificados.map((ej: any, idx: number) => (
        <div key={`${ej.id}-${idx}`} className="p-4 bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center gap-5 border border-slate-700/50">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-black text-slate-400 flex-shrink-0">{idx + 1}</div>
          {ej.ejercicio_imagen ? <img src={ej.ejercicio_imagen} className="w-20 h-20 rounded-xl object-cover bg-black/50 shadow-inner" /> : <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center"><Dumbbell className="w-10 h-10 text-slate-600"/></div>}
          <div>
            <h4 className="font-bold text-xl text-white leading-tight">{ej.ejercicio_nombre}</h4>
            <p className="text-slate-400 font-medium mt-1.5">{ej.series || 1} series × {ej.reps_max || ej.reps_min || '?'} reps</p>
          </div>
        </div>
      ))}
    </div>
    <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent flex gap-4 justify-center pointer-events-none z-10">
      <button onClick={actions.goBackToSelect} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 transition-colors pointer-events-auto shadow-lg border border-slate-700">Atrás</button>
      <button onClick={actions.startWorkout} className="flex-1 max-w-md py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xl font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-transform active:scale-95 pointer-events-auto">
        <Play fill="currentColor" className="w-6 h-6"/> Empezar Rutina
      </button>
    </div>
  </div>
);

export const PasoEntrenando = ({ state, actions }: any) => {
  const [showList, setShowList] = useState(false);
  const ej = state.ejerciciosPlanificados[state.currentExerciseIndex];
  
  const setsHechos = state.historial.filter((h: any) => h.rutina_realizacion_id === ej.id).length;
  const currentSerie = setsHechos + 1;
  const totalSeries = ej.series || 1;

  const [carga, setCarga] = useState('');
  const [reps, setReps] = useState('');

  useEffect(() => {
    setCarga(ej.carga_actual?.toString() || '');
    setReps(ej.reps_max?.toString() || ej.reps_min?.toString() || '');
  }, [ej.id, currentSerie]);

  const nextExercise = state.ejerciciosPlanificados[state.currentExerciseIndex + 1];
  const nextText = nextExercise ? `Próximo: ${nextExercise.ejercicio_nombre}` : 'Último ejercicio de la rutina';

  return (
    <div className="w-full flex flex-col flex-1 pb-44 animate-in slide-in-from-right-4 duration-300">
      
      {/* TÍTULO Y FASE */}
      <div className="w-full max-w-2xl mx-auto px-6 mt-4 flex flex-col items-center text-center">
        <span className="text-indigo-400 font-bold text-sm tracking-widest uppercase mb-1">{ej.fase}</span>
        <h2 className="text-3xl md:text-5xl font-black leading-tight text-white drop-shadow-sm">{ej.ejercicio_nombre}</h2>
        {ej.equipamiento_nombre && <span className="inline-block px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-sm border border-slate-700 mt-3 font-medium">{ej.equipamiento_nombre}</span>}
      </div>

      {/* IMAGEN DE LADO A LADO CON ETIQUETA DE SERIE PEQUEÑA */}
      <div className="relative w-full max-w-6xl mx-auto flex justify-center px-4 mb-4 mt-6">
        {ej.ejercicio_imagen ? (
          <img src={ej.ejercicio_imagen} className="w-full h-auto max-h-[40vh] md:max-h-[50vh] object-contain rounded-2xl drop-shadow-2xl opacity-95" />
        ) : (
          <div className="w-full h-[25vh] flex justify-center items-center bg-slate-800/30 rounded-2xl">
            <Dumbbell className="w-20 h-20 text-slate-600" />
          </div>
        )}
        
        {/* Etiqueta Serie (Reducida y arriba a la derecha) */}
        <div className="absolute top-4 right-6 md:top-6 md:right-8 bg-indigo-600/90 backdrop-blur text-white px-3 py-1.5 rounded-xl border border-indigo-400/50 shadow-lg z-10">
          <span className="font-bold text-sm drop-shadow-sm">
            Serie {currentSerie} / {totalSeries}
          </span>
        </div>
      </div>

      {/* INPUTS DE CARGA Y REPS + PRÓXIMO EJERCICIO */}
      <div className="w-full max-w-md mx-auto px-6">
        <div className="grid grid-cols-2 gap-5 mt-2">
          <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl text-center flex flex-col items-center">
            <label className="block text-slate-400 text-xs font-bold mb-3 uppercase tracking-wider">Peso ({ej.unidad_carga || 'kg'})</label>
            <input type="number" step="0.1" value={carga} onChange={e => setCarga(e.target.value)} className="w-full bg-transparent text-5xl font-black text-white focus:outline-none focus:ring-0 text-center" placeholder="0" />
          </div>
          <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl text-center flex flex-col items-center">
            <label className="block text-slate-400 text-xs font-bold mb-3 uppercase tracking-wider">Reps</label>
            <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full bg-transparent text-5xl font-black text-white focus:outline-none focus:ring-0 text-center" placeholder="0" />
          </div>
        </div>
        
        {/* Próximo Ejercicio (Justo debajo de los inputs) */}
        <div className="mt-6 bg-slate-800/40 px-5 py-3 rounded-2xl border border-slate-700/50 w-full text-center shadow-inner">
          <span className="text-sm font-bold text-slate-400">{nextText}</span>
        </div>
      </div>

      {/* BOTONERA FIJA INFERIOR */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-slate-900 via-slate-900 to-transparent flex flex-col items-center pt-10 pb-6 px-6 z-20 pointer-events-none">
        <button onClick={() => actions.completeSet(reps, carga)} className="w-full max-w-md py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xl font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.3)] pointer-events-auto transition-transform active:scale-95">
          <CheckCircle2 className="w-7 h-7" /> Completar Serie
        </button>

        <button onClick={() => setShowList(true)} className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-300 font-bold px-4 py-2 rounded-lg transition-colors pointer-events-auto">
          <List className="w-5 h-5" /> Ver toda la rutina
        </button>
      </div>

      <ModalListadoRutina isOpen={showList} onClose={() => setShowList(false)} state={state} actions={actions} />
    </div>
  );
};

export const PasoDescanso = ({ state, actions }: any) => {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (state.timeLeft > 0) {
      timer = setInterval(() => actions.tickTimer(), 1000);
    } else if (state.timeLeft === 0) {
      playBeep();
      actions.skipRest();
    }
    return () => clearInterval(timer);
  }, [state.timeLeft]);

  const nextExercise = state.ejerciciosPlanificados[state.currentExerciseIndex];
  const nextText = nextExercise ? `Próximo: ${nextExercise.ejercicio_nombre}` : 'Último ejercicio de la rutina';

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <Timer className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-white drop-shadow-sm">Descanso</h2>
        <p className="text-indigo-300 font-bold bg-indigo-900/30 border border-indigo-500/30 px-5 py-2 rounded-full shadow-sm">{nextText}</p>
      </div>
      
      <div className="relative flex items-center justify-center">
        <div className="w-72 h-72 rounded-full border-[12px] border-slate-800 flex items-center justify-center shadow-[0_0_80px_rgba(79,70,229,0.15)]">
          <span className="text-8xl font-black tracking-tighter text-indigo-400 drop-shadow-md">
            {Math.floor(state.timeLeft / 60)}:{(state.timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <button onClick={() => { playBeep(); actions.skipRest(); }} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-lg flex items-center gap-2 transition-colors border border-slate-700 text-slate-300 shadow-lg">
        Omitir Descanso <FastForward className="w-5 h-5" />
      </button>
    </div>
  );
};

export const PasoFinalizado = ({ state, actions }: any) => {
  const agrupados = state.ejerciciosPlanificados.map((ej: any) => ({
    ejercicio: ej,
    series: state.historial.filter((h: any) => h.rutina_realizacion_id === ej.id)
  })).filter((g: any) => g.series.length > 0);

  return (
    <div className="w-full flex-1 flex flex-col items-center p-6 pb-32 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
        <Trophy className="w-12 h-12 text-emerald-400" />
      </div>
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">¡Completado!</h1>
        <p className="text-xl text-slate-400">Has machacado la rutina <span className="text-emerald-400 font-bold">{state.selectedRutina?.nombre}</span></p>
      </div>

      <div className="w-full max-w-2xl flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {agrupados.map((grupo: any, idx: number) => (
          <div key={`${grupo.ejercicio.id}-${idx}`} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-lg">
            <h4 className="font-black text-xl text-white mb-4 leading-tight">{grupo.ejercicio.ejercicio_nombre}</h4>
            <div className="space-y-2">
              {grupo.series.map((s: any) => (
                <div key={s.serie_numero} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-bold text-sm">Serie {s.serie_numero}</span>
                  <span className="font-black text-lg text-indigo-300">
                    {s.carga_completada || 0} <span className="text-sm font-medium text-indigo-400/70">{s.unidad_carga || 'kg'}</span> × {s.reps_completadas || 0} <span className="text-sm font-medium text-indigo-400/70">reps</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent flex justify-center z-20 pointer-events-none">
        <button onClick={actions.saveWorkout} className="w-full max-w-md py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xl font-black flex items-center justify-center gap-3 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.3)] pointer-events-auto active:scale-95">
          <CheckCircle2 className="w-7 h-7" /> Guardar en Historial
        </button>
      </div>
    </div>
  );
};