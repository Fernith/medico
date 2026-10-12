import React, { useState } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';
import { Users, HeartCrack, Clock, FileText } from 'lucide-react';

export type ParentescoFamiliar =
  | 'padre'
  | 'madre'
  | 'hermano'
  | 'hermana'
  | 'hijo'
  | 'hija'
  | 'abuelo_paterno'
  | 'abuela_paterna'
  | 'abuelo_materno'
  | 'abuela_materna'
  | 'tio_paterno'
  | 'tia_paterna'
  | 'tio_materno'
  | 'tia_materna'
  | 'primo'
  | 'prima'
  | 'otro';

export interface AntecedenteFamiliar {
  id: string;
  enfermedad: string;
  parentesco: ParentescoFamiliar;
  edad_diagnostico: number | null;
  fallecido: boolean;
  edad_fallecimiento: number | null;
  detalles: string | null;
}

interface AntecedenteFormProps {
  initialData?: AntecedenteFamiliar | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const indigoInputTheme: Partial<InputColorTheme> = {
  borderNormal: 'border-slate-200 hover:border-indigo-300',
  borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500',
  iconColor: 'text-indigo-500',
};

const indigoSelectTheme = {
  borderNormal: 'border-slate-200',
  borderActive: 'border-indigo-500 ring-4 ring-indigo-50',
  borderHover: 'hover:border-indigo-300 hover:shadow-md',
  textSelected: 'text-indigo-900',
  iconColor: 'text-indigo-500',
  optionSelectedBg: 'bg-indigo-50',
  optionSelectedText: 'text-indigo-700',
  optionHoverBg: 'hover:bg-indigo-50/50',
  optionHoverText: 'hover:text-indigo-900',
  checkIcon: 'text-indigo-500',
};

export const AntecedenteForm: React.FC<AntecedenteFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [enfermedad, setEnfermedad] = useState(initialData?.enfermedad || '');
  const [parentesco, setParentesco] = useState<ParentescoFamiliar>(initialData?.parentesco || 'padre');
  const [edadDiagnostico, setEdadDiagnostico] = useState<string>(
    initialData?.edad_diagnostico !== null && initialData?.edad_diagnostico !== undefined
      ? String(initialData.edad_diagnostico)
      : ''
  );
  const [fallecido, setFallecido] = useState<boolean>(initialData?.fallecido ?? false);
  const [edadFallecimiento, setEdadFallecimiento] = useState<string>(
    initialData?.edad_fallecimiento !== null && initialData?.edad_fallecimiento !== undefined
      ? String(initialData.edad_fallecimiento)
      : ''
  );
  const [detalles, setDetalles] = useState(initialData?.detalles || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enfermedad.trim()) {
      setError('Por favor indica la enfermedad o evento médico.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      enfermedad: enfermedad.trim(),
      parentesco,
      edad_diagnostico: edadDiagnostico !== '' ? Number(edadDiagnostico) : null,
      fallecido,
      edad_fallecimiento: fallecido && edadFallecimiento !== '' ? Number(edadFallecimiento) : null,
      detalles: detalles.trim() || null,
    };

    try {
      if (initialData?.id) {
        await apiClient.put(`/antecedentes/${initialData.id}`, payload);
      } else {
        await apiClient.post('/antecedentes', payload);
      }
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError('Error al guardar el antecedente familiar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input
            label="Enfermedad o Evento Médico"
            value={enfermedad}
            onChange={(e) => setEnfermedad(e.target.value)}
            placeholder="Ej. Infarto de miocardio, Cáncer de colon, Ictus cerebral, Diabetes tipo 2..."
            required
            colorTheme={indigoInputTheme}
            icon={<HeartCrack className="w-5 h-5" />}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Parentesco</label>
          <Select
            value={parentesco}
            onChange={(val) => setParentesco(val as ParentescoFamiliar)}
            options={[
              { value: 'padre', label: 'Padre' },
              { value: 'madre', label: 'Madre' },
              { value: 'hermano', label: 'Hermano' },
              { value: 'hermana', label: 'Hermana' },
              { value: 'hijo', label: 'Hijo' },
              { value: 'hija', label: 'Hija' },
              { value: 'abuelo_paterno', label: 'Abuelo Paterno' },
              { value: 'abuela_paterna', label: 'Abuela Paterna' },
              { value: 'abuelo_materno', label: 'Abuelo Materno' },
              { value: 'abuela_materna', label: 'Abuela Materna' },
              { value: 'tio_paterno', label: 'Tío Paterno' },
              { value: 'tia_paterna', label: 'Tía Paterna' },
              { value: 'tio_materno', label: 'Tío Materno' },
              { value: 'tia_materna', label: 'Tía Materna' },
              { value: 'primo', label: 'Primo' },
              { value: 'prima', label: 'Prima' },
              { value: 'otro', label: 'Otro familiar' },
            ]}
            colorTheme={indigoSelectTheme}
            icon={<Users className="w-5 h-5 text-indigo-500" />}
          />
        </div>

        <Input
          label="Edad aproximada al diagnóstico / evento"
          type="number"
          min={0}
          max={125}
          value={edadDiagnostico}
          onChange={(e) => setEdadDiagnostico(e.target.value)}
          placeholder="Ej. 48"
          colorTheme={indigoInputTheme}
          icon={<Clock className="w-5 h-5" />}
          helperText="Clave preventiva: eventos precoces (<55 años) sugieren mayor carga genética"
        />

        <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fallecido}
              onChange={(e) => setFallecido(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-semibold text-slate-800">
              ¿Falleció el familiar a causa del evento o posteriormente?
            </span>
          </label>

          {fallecido && (
            <div className="pt-2">
              <Input
                label="Edad al fallecer"
                type="number"
                min={0}
                max={125}
                value={edadFallecimiento}
                onChange={(e) => setEdadFallecimiento(e.target.value)}
                placeholder="Ej. 52"
                colorTheme={indigoInputTheme}
              />
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <Input
            label="Detalles y Contexto (Opcional)"
            value={detalles}
            onChange={(e) => setDetalles(e.target.value)}
            placeholder="Ej. Fumador severo, hipertensión previa no tratada, situación de alto estrés, superó el episodio..."
            colorTheme={indigoInputTheme}
            icon={<FileText className="w-5 h-5" />}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

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
          colorTheme={{
            bgNormal: 'bg-indigo-600',
            bgHover: 'hover:bg-indigo-700',
            textColor: 'text-white',
            focusRing: 'focus:ring-indigo-500',
          }}
          className="px-6"
        >
          {initialData ? 'Guardar Cambios' : 'Añadir Antecedente'}
        </Button>
      </div>
    </form>
  );
};

