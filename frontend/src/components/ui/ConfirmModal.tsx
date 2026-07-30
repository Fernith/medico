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
  isConfirming?: boolean;
  variant?: Extract<ButtonVariant, 'primary' | 'secondary' | 'danger' | 'success'>;
  children?: React.ReactNode;
  hideCancel?: boolean; // <--- NUEVA PROPIEDAD
}

export const ConfirmModal = ({
  isOpen, title, description, onConfirm, onCancel,
  confirmText = 'Confirmar', cancelText = 'Cancelar', isConfirming = false, variant = 'primary',
  children, hideCancel = false // <--- VALOR POR DEFECTO
}: ConfirmModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const borderColors = {
    primary: 'border-pink-400', secondary: 'border-orange-400',
    danger: 'border-red-500', success: 'border-emerald-500'
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div 
        ref={modalRef}
        className={`bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 border-2 ${borderColors[variant]}`}
      >
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className={`text-slate-500 ${children ? 'mb-4' : 'mb-8'}`}>{description}</p>
        
        {children && <div className="mb-8">{children}</div>}
        
        <div className="flex gap-3">
          {/* RENDERIZADO CONDICIONAL DEL BOTÓN CANCELAR */}
          {!hideCancel && (
            <Button onClick={onCancel} variant="ghost" className="flex-1" disabled={isConfirming}>
              {cancelText}
            </Button>
          )}
          <Button onClick={onConfirm} variant={variant} className="flex-1" isLoading={isConfirming}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};