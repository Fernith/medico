import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Sparkles } from 'lucide-react';

interface PromptConsultaFormProps {
  onGenerar: (consulta: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEFAULT_CONSULTA =
  'Quiero evaluar mi estado de salud general, áreas en las que centrarme, aspectos a medir, cambios a realizar y de qué tengo mayor riesgo (y, por supuesto, qué hacer para prevenirlo).';

export const PromptConsultaForm: React.FC<PromptConsultaFormProps> = ({
  onGenerar,
  onCancel,
  isLoading = false,
}) => {
  const [consulta, setConsulta] = useState(DEFAULT_CONSULTA);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerar(consulta);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col space-y-2">
        <label
          htmlFor="entrada-consulta"
          className="text-sm font-bold text-slate-700 flex items-center gap-1.5"
        >
          <span>Entrada de la consulta / Motivo clínico</span>
          <span className="text-indigo-500 font-normal text-xs">(Editable)</span>
        </label>
        <p className="text-xs text-slate-500">
          Describe tu consulta actual, síntomas recientes, resultados analíticos o preguntas preventivas para la IA clínica.
        </p>

        <textarea
          id="entrada-consulta"
          rows={6}
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Escribe aquí tu consulta o situación médica actual..."
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all resize-y min-h-[140px]"
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          icon={<Sparkles className="w-4 h-4" />}
          colorTheme={{
            bgNormal: 'bg-indigo-600',
            bgHover: 'hover:bg-indigo-700',
            textColor: 'text-white',
            focusRing: 'focus:ring-indigo-500',
          }}
          className="px-6"
        >
          Generar prompt
        </Button>
      </div>
    </form>
  );
};

