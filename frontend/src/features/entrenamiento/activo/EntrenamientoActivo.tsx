import React, { useState } from 'react';
import { X, Activity, AlertTriangle } from 'lucide-react';
import { useEntrenamiento } from './activo/useEntrenamiento';
import { PasoSeleccion, PasoResumenInicial, PasoEntrenando, PasoDescanso, PasoFinalizado } from './activo/Pasos';

interface EntrenamientoActivoProps {
  onClose: () => void;
}

export const EntrenamientoActivo: React.FC<EntrenamientoActivoProps> = ({ onClose }) => {
  const [showAbortModal, setShowAbortModal] = useState(false);
  const { state, actions } = useEntrenamiento(onClose);

  return (
    <>
      {/* CAPA PRINCIPAL DEL ENTRENAMIENTO */}
      <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center overflow-y-auto overflow-x-hidden">
        
        {/* Cabecera Global */}
        {state.step !== 'FINISHED' && (
          <div className="w-full max-w-3xl px-4 py-4 flex justify-between items-center bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-400" />
              <span className="font-bold tracking-widest text-sm text-slate-300 uppercase">Entrenamiento Activo</span>
            </div>
            <button onClick={() => setShowAbortModal(true)} className="p-2 bg-slate-800 hover:bg-rose-500 rounded-full transition-colors shadow-sm">
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* MÁQUINA DE ESTADOS */}
        {state.step === 'SELECT_RUTINA' && <PasoSeleccion state={state} actions={actions} />}
        {state.step === 'PREVIEW'       && <PasoResumenInicial state={state} actions={actions} />}
        {state.step === 'WORKOUT'       && <PasoEntrenando state={state} actions={actions} />}
        {state.step === 'REST'          && <PasoDescanso state={state} actions={actions} />}
        {state.step === 'FINISHED'      && <PasoFinalizado state={state} actions={actions} />}

        {/* MODAL INTEGRADO DE CANCELACIÓN */}
        {showAbortModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900">
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-rose-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black mb-2">¿Seguro que sales?</h3>
                <p className="text-slate-500 font-medium">Se perderá todo el progreso de la sesión actual y no se guardará en el historial.</p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button onClick={() => setShowAbortModal(false)} className="flex-1 px-4 py-3 font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
                  Continuar
                </button>
                <button onClick={() => { setShowAbortModal(false); onClose(); }} className="flex-1 px-4 py-3 font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors shadow-sm">
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