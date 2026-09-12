import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ToastData {
  id: string;
  medNombre: string;
  historialId: string;
}

interface MedicacionToastProps {
  toast: ToastData;
  onDeshacer: (toast: ToastData) => void;
  onClose: (id: string) => void;
}

export const MedicacionToast: React.FC<MedicacionToastProps> = ({ toast, onDeshacer, onClose }) => {
  // Autodestrucción a los 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className="bg-white border border-teal-100 pl-5 pr-2 py-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
      <p className="text-sm font-medium text-slate-600 py-1">
        Has marcado <span className="font-bold text-teal-600">{toast.medNombre}</span> como tomado.
      </p>
      
      <button 
        onClick={() => onDeshacer(toast)}
        className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-100 transition-colors uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100/50 ml-2 shrink-0"
      >
        Deshacer
      </button>

      {/* Botón X para cerrar manualmente */}
      <button 
        onClick={() => onClose(toast.id)}
        className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors shrink-0 ml-1"
        title="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};