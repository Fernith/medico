import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { type HistorialMedicacion } from '../medicamentos/HistorialMedicacionForm';
import { MedicacionToast, type ToastData } from '../medicamentos/MedicacionToast';

export const MedicamentosWidget: React.FC = () => {
  const [pendientes, setPendientes] = useState<HistorialMedicacion[]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const fetchPendientesHoy = useCallback(async () => {
    // Calculamos el inicio y fin de HOY en la zona horaria del usuario
    const hoy = new Date();
    const start = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const end = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    try {
      const res = await fetch(`/api/historial-medicacion/pendientes?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (res.ok) setPendientes(await res.json());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchPendientesHoy();
    const handleRegistro = () => fetchPendientesHoy();
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, [fetchPendientesHoy]);

  const handleTomar = async (med: HistorialMedicacion) => {
    // UI Optimista: Lo quitamos de la lista al instante
    setPendientes(prev => prev.filter(p => p.id !== med.id));
    
    try {
      await fetch(`/api/historial-medicacion/${med.id}/tomado`, { method: 'PATCH' });
      
      // Añadimos el Toast
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, medNombre: med.medicamento_nombre, historialId: med.id }]);
      
      
    } catch (err) {
      console.error(err);
      fetchPendientesHoy(); // Si falla, recargamos la lista real
    }
  };

  const handleDeshacer = async (toast: ToastData) => {
    // Quitamos el Toast inmediatamente
    setToasts(prev => prev.filter(t => t.id !== toast.id));
    
    try {
      await fetch(`/api/historial-medicacion/${toast.historialId}/pendiente`, { method: 'PATCH' });
      fetchPendientesHoy(); // Recargamos para que vuelva a aparecer
    } catch (err) { console.error(err); }
  };

  const formatearHora = (isoString: string) => {
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
  };

  return (
    <>
      <div className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col h-full">

        <Link 
          to="/medicamentos" 
          className="flex items-center gap-2 mb-6 group w-max"
        >
          <h3 className="font-bold text-teal-800 text-xl group-hover:text-teal-600 transition-colors">Pastillas Hoy</h3>
          <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-teal-500 transition-colors" strokeWidth={3} />
        </Link>

        {/* LISTADO DE PENDIENTES CON SCROLL (Máximo ~2 elementos visibles) */}
        <div className="flex-1 flex flex-col gap-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
          {pendientes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 h-full">
              <p className="text-sm font-medium text-slate-500">¡Todo al día! No tienes medicación pendiente para hoy.</p>
            </div>
          ) : (
            pendientes.map(med => (
              <div key={med.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group shrink-0">
                <div className="flex flex-col overflow-hidden mr-2">
                  <span className="font-bold text-slate-700 truncate">{med.medicamento_nombre}</span>
                  <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md w-max mt-1">
                    {formatearHora(med.fecha_hora)} • {med.cantidad_tomada} {med.formato}(s)
                  </span>
                </div>
                <button 
                  onClick={() => handleTomar(med)}
                  title="Marcar como tomado"
                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border-2 border-slate-200 text-slate-300 rounded-full hover:border-teal-500 hover:bg-teal-500 hover:text-white transition-all shadow-sm"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PORTAL DE TOASTS (Tonos claros adaptados a la app) */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <MedicacionToast 
              key={toast.id} 
              toast={toast} 
              onDeshacer={handleDeshacer} 
              onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} 
            />
          ))}
        </div>,
        document.body
      )}
    </>
  );
};