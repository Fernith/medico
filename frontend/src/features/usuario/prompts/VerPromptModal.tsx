import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Copy, Check, FileCheck } from 'lucide-react';

interface VerPromptModalProps {
  textoPrompt: string;
  onSalir: () => void;
}

export const VerPromptModal: React.FC<VerPromptModalProps> = ({
  textoPrompt,
  onSalir,
}) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(textoPrompt);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* CABECERA EXPLICATIVA */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <FileCheck className="w-4 h-4 text-indigo-500" />
          Prompt clínico listo para usar en tu modelo de lenguaje (Gemini / Claude / GPT)
        </span>
      </div>

      {/* RECUADRO CON SCROLL EXCLUSIVO Y BOTON COPIAR EN EL BORDE */}
      <div className="relative rounded-2xl border-2 border-indigo-100 bg-slate-900 text-slate-100 shadow-inner overflow-hidden">
        {/* BOTON COPIAR FLOTANTE EN EL BORDE SUPERIOR DERECHO */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={handleCopiar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md backdrop-blur-md ${
              copiado
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600/90 text-white hover:bg-indigo-500 active:scale-95'
            }`}
            title="Copiar prompt al portapapeles"
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar prompt</span>
              </>
            )}
          </button>
        </div>

        {/* CONTENEDOR CON SCROLL INDEPENDIENTE */}
        <div className="p-4 sm:p-5 max-h-[58vh] overflow-y-auto custom-scrollbar font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text pr-24 sm:pr-28">
          {textoPrompt}
        </div>
      </div>

      {/* BOTON SALIR FIJO EN LA PARTE INFERIOR */}
      <div className="flex justify-end pt-3 border-t border-slate-100">
        <Button
          type="button"
          onClick={onSalir}
          variant="ghost"
          className="px-6 py-2"
        >
          Salir
        </Button>
      </div>
    </div>
  );
};

