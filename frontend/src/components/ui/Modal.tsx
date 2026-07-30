import React, { useEffect } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalPosition = 'center' | 'top'; // <--- NUEVO

export interface ModalColorTheme {
  titleColor: string;
  headerBorder: string;
  closeIconColor: string;
  closeIconHover: string;
  modalBorder: string; 
}

const defaultTheme: ModalColorTheme = {
  titleColor: 'text-purple-900',
  headerBorder: 'border-pink-100',
  closeIconColor: 'text-gray-400',
  closeIconHover: 'hover:text-pink-500',
  modalBorder: 'border-pink-400',
};

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  preventClose?: boolean;
  size?: ModalSize;
  colorTheme?: Partial<ModalColorTheme>;
  position?: ModalPosition; // <--- NUEVO
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, children, preventClose = false, size = 'md', colorTheme = {}, position = 'center' // <--- POR DEFECTO CENTER
}) => {
  const theme = { ...defaultTheme, ...colorTheme };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !preventClose) onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventClose) onClose();
  };

  // <-- Lógica para centrar o alinear arriba -->
  const positionClasses = position === 'center' ? 'items-center' : 'items-start pt-10 md:pt-16';

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity ${positionClasses}`}
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} overflow-hidden transform transition-all flex flex-col max-h-[90vh] border-2 ${theme.modalBorder}`}>
        <div className={`flex justify-between items-center p-5 border-b ${theme.headerBorder} flex-shrink-0`}>
          <h3 className={`text-xl font-bold ${theme.titleColor}`}>{title}</h3>
          {!preventClose && (
            <button onClick={onClose} className={`${theme.closeIconColor} ${theme.closeIconHover} transition-colors p-1 rounded-full focus:outline-none`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          )}
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};