interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string; // Opcional: por defecto será "Confirmar"
  cancelText?: string;  // Opcional: por defecto será "Cancelar"
}

export const ConfirmModal = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: ConfirmModalProps) => {
  // Si no está abierto, no renderizamos absolutamente nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-8">{description}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};