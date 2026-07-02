import { useState } from 'react';
import { Droplet } from 'lucide-react';
import { useAjustes } from '../../context/AjustesContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export const AjusteVisibilidadRegla = () => {
  const { ajustes, actualizarAjuste } = useAjustes();
  const [showModal, setShowModal] = useState(false);
  
  const isEnabled = ajustes['mostrar_regla'] !== 'false';

  const confirmarCambio = () => {
    actualizarAjuste('mostrar_regla', isEnabled ? 'false' : 'true');
    setShowModal(false);
  };

  return (
    <>
      {/* TARJETA DEL AJUSTE */}
      <div className="bg-white p-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-pink-50 rounded-2xl">
            <Droplet className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Seguimiento de la Regla</h3>
            <p className="text-sm text-slate-500">Muestra el módulo de ciclo menstrual en la app.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className={`w-14 h-8 rounded-full flex items-center transition-colors p-1 ${isEnabled ? 'bg-indigo-500' : 'bg-slate-200'}`}
        >
          <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

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
    </>
  );
};