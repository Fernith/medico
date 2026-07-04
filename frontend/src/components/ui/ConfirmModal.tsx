import { useEffect, useRef } from 'react';
import { Button, type ButtonVariant } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean; // Para mostrar el spinner
  variant?: Extract<ButtonVariant, 'primary' | 'secondary' | 'danger'>; // Vincula el modal con los colores de la app
}

export const ConfirmModal = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isConfirming = false,
  variant = 'primary' // Por defecto, usará tus tonos rosas
}: ConfirmModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Accesibilidad: Cerrar al hacer clic fuera o pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitamos que se cierre si está en medio de un guardado/borrado
      if (e.key === 'Escape' && !isConfirming) onCancel();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !isConfirming) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel, isConfirming]);

  if (!isOpen) return null;

  // Diccionario para vincular el 'variant' del botón con el color del borde del modal
  const borderColors = {
    primary: 'border-pink-400',
    secondary: 'border-orange-400',
    danger: 'border-red-500',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div 
        ref={modalRef}
        className={`bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 border-2 ${borderColors[variant]}`}
      >
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-8">{description}</p>
        
        <div className="flex gap-3">
          <Button 
            onClick={onCancel} 
            variant="ghost" // Usa el diseño limpio de fondo blanco que hicimos
            className="flex-1"
            disabled={isConfirming}
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm} 
            variant={variant} // Pasa el color rojo/rosa/naranja dinámicamente
            className="flex-1"
            isLoading={isConfirming} // Mostrará el spinner si está procesando
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};