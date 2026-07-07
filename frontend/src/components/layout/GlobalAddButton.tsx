import React, { useState } from 'react';
import { ModalAdd } from '../ui/ModalAdd';

export const GlobalAddButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante abajo a la derecha */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 hover:scale-105 hover:shadow-pink-500/30 transition-all flex items-center justify-center z-40 focus:outline-none"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
        </svg>
      </button>

      {/* Modal Genérico Separado */}
      <ModalAdd isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};