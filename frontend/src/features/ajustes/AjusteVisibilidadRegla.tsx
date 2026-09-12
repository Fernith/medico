import { useState } from 'react';
import { Droplet } from 'lucide-react';
import { useAjustes } from '../../context/AjustesContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AjustesParametrosRegla } from './AjustesParametrosRegla';

export const AjusteVisibilidadRegla = () => {
  const { ajustes, actualizarAjuste } = useAjustes();
  const [showModal, setShowModal] = useState(false);
  
  const isEnabled = ajustes['mostrar_regla'] !== 'false';

  const confirmarCambio = () => {
    actualizarAjuste('mostrar_regla', isEnabled ? 'false' : 'true');
    setShowModal(false);
  };

  return (
    <div id="seccion-regla" className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 w-full scroll-mt-20">
      
      {/* CABECERA (Interruptor de Visibilidad) */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="shrink-0 p-3 bg-pink-50 rounded-2xl">
            <Droplet className="w-6 h-6 text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800">Seguimiento de la Regla</h3>
            <p className="text-sm text-slate-500 break-words">Muestra y configura el módulo de ciclo menstrual en la app.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className={`shrink-0 w-14 h-8 rounded-full flex items-center transition-colors p-1 ${isEnabled ? 'bg-indigo-500' : 'bg-slate-200'}`}
        >
          <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* CONTENIDO DESPLEGABLE (Parámetros) */}
      {isEnabled && (
        <div className="pt-6 mt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <AjustesParametrosRegla isVisible={true} />
        </div>
      )}

      <ConfirmModal 
        isOpen={showModal}
        title={isEnabled ? '¿Ocultar seguimiento de regla?' : '¿Mostrar seguimiento de regla?'}
        description={isEnabled 
          ? 'El apartado desaparecerá, pero tus datos guardados no se borrarán.' 
          : 'El apartado volverá a estar disponible.'
        }
        onConfirm={confirmarCambio}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
};