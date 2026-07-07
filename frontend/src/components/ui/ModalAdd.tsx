import React, { useState } from 'react';
import { Modal, type ModalColorTheme } from './Modal';
import { PesoForm } from '../../features/peso/PesoForm';
import { ReglaForm } from '../../features/regla/ReglaForm';

interface ModalAddProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalAdd: React.FC<ModalAddProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'peso' | 'regla'>('peso');

  // Definimos los colores para el dominio Peso (Esmeralda)
  const pesoTheme: Partial<ModalColorTheme> = {
    titleColor: 'text-emerald-900',
    headerBorder: 'border-emerald-100',
    closeIconHover: 'hover:text-emerald-500',
    modalBorder: 'border-emerald-400',
  };

  // Definimos los colores para el dominio Regla (Rosa/Morado)
  const reglaTheme: Partial<ModalColorTheme> = {
    titleColor: 'text-purple-900',
    headerBorder: 'border-pink-100',
    closeIconHover: 'hover:text-pink-500',
    modalBorder: 'border-pink-400',
  };

  // Seleccionamos el tema activo
  const currentTheme = activeTab === 'peso' ? pesoTheme : reglaTheme;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nuevo Registro" 
      preventClose={true}
      colorTheme={currentTheme}
    >
      
      {/* Pestañas de Navegación con Colores Dinámicos */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 transition-colors">
        <button 
          onClick={() => setActiveTab('peso')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'peso' 
              ? 'bg-white text-emerald-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Peso
        </button>
        <button 
          onClick={() => setActiveTab('regla')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
            activeTab === 'regla' 
              ? 'bg-white text-pink-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Regla
        </button>
      </div>

      {/* Contenido Dinámico */}
      <div className="transition-opacity duration-300">
        {activeTab === 'peso' && (
          <PesoForm onSuccess={onClose} onCancel={onClose} />
        )}
        
        {activeTab === 'regla' && (
          <ReglaForm onSuccess={onClose} onCancel={onClose} />
        )}
      </div>
    </Modal>
  );
};