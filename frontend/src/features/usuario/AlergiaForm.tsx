import React, { useState } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';
import { AlertCircle, Calendar, FileText, ShieldAlert } from 'lucide-react';

export type TipoCondicionAlergia = 'alergia' | 'intolerancia';

export type CategoriaAlergeno =
  | 'alimento'
  | 'medicamento'
  | 'ambiental'
  | 'contacto'
  | 'veneno_insecto'
  | 'otro';

export type TipoReaccionAlergia =
  | 'urticaria'
  | 'angioedema'
  | 'rinitis'
  | 'anafilaxia'
  | 'gastrointestinal'
  | 'dermatitis'
  | 'asma'
  | 'otra';

export type GravedadAlergia =
  | 'leve'
  | 'moderada'
  | 'grave'
  | 'potencialmente_mortal';

export interface Alergia {
  id: string;
  sustancia: string;
  tipo: TipoCondicionAlergia;
  categoria: CategoriaAlergeno;
  reaccion: TipoReaccionAlergia;
  gravedad: GravedadAlergia;
  fecha_diagnostico: string | null;
  notas: string | null;
}

interface AlergiaFormProps {
  initialData?: Alergia | null;
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

export const AlergiaForm: React.FC<AlergiaFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [sustancia, setSustancia] = useState(initialData?.sustancia || '');
  const [tipo, setTipo] = useState<TipoCondicionAlergia>(initialData?.tipo || 'alergia');
  const [categoria, setCategoria] = useState<CategoriaAlergeno>(initialData?.categoria || 'alimento');
  const [reaccion, setReaccion] = useState<TipoReaccionAlergia>(initialData?.reaccion || 'urticaria');
  const [gravedad, setGravedad] = useState<GravedadAlergia>(initialData?.gravedad || 'leve');
  const [fechaDiagnostico, setFechaDiagnostico] = useState(initialData?.fecha_diagnostico || '');
  const [notas, setNotas] = useState(initialData?.notas || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sustancia.trim()) {
      setError('Por favor indica la sustancia o alérgeno.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      sustancia: sustancia.trim(),
      tipo,
      categoria,
      reaccion,
      gravedad,
      fecha_diagnostico: fechaDiagnostico || null,
      notas: notas.trim() || null,
    };

    try {
      if (initialData?.id) {
        await apiClient.put(`/alergias/${initialData.id}`, payload);
      } else {
        await apiClient.post('/alergias', payload);
      }
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError('Error al guardar la alergia o intolerancia.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input
            label="Sustancia o Alérgeno"
            value={sustancia}
            onChange={(e) => setSustancia(e.target.value)}
            placeholder="Ej. Penicilina, Frutos secos, Polen de olivo, Lactosa..."
            required
            colorTheme={indigoInputTheme}
            icon={<AlertCircle className="w-5 h-5" />}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Tipo de Condición</label>
          <Select
            value={tipo}
            onChange={(val) => setTipo(val as TipoCondicionAlergia)}
            options={[
              { value: 'alergia', label: 'Alergia (Inmunológica)' },
              { value: 'intolerancia', label: 'Intolerancia (Digestiva / Metabólica)' },
            ]}
            colorTheme={indigoSelectTheme}
            icon={<ShieldAlert className="w-5 h-5 text-indigo-500" />}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Categoría</label>
          <Select
            value={categoria}
            onChange={(val) => setCategoria(val as CategoriaAlergeno)}
            options={[
              { value: 'alimento', label: 'Alimento' },
              { value: 'medicamento', label: 'Medicamento' },
              { value: 'ambiental', label: 'Ambiental (Polen, polvo, ácaros...)' },
              { value: 'contacto', label: 'Contacto (Látex, metales...)' },
              { value: 'veneno_insecto', label: 'Veneno de insectos (Avispas, abejas...)' },
              { value: 'otro', label: 'Otro' },
            ]}
            colorTheme={indigoSelectTheme}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Reacción Principal</label>
          <Select
            value={reaccion}
            onChange={(val) => setReaccion(val as TipoReaccionAlergia)}
            options={[
              { value: 'urticaria', label: 'Urticaria (Habones, picor)' },
              { value: 'angioedema', label: 'Angioedema (Hinchazón labios/párpados)' },
              { value: 'rinitis', label: 'Rinitis (Estornudos, congestión)' },
              { value: 'anafilaxia', label: 'Anafilaxia (Reacción generalizada grave)' },
              { value: 'gastrointestinal', label: 'Gastrointestinal (Dolor, vómito, diarrea)' },
              { value: 'dermatitis', label: 'Dermatitis / Eccema' },
              { value: 'asma', label: 'Asma / Dificultad respiratoria' },
              { value: 'otra', label: 'Otra manifestación' },
            ]}
            colorTheme={indigoSelectTheme}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Gravedad</label>
          <Select
            value={gravedad}
            onChange={(val) => setGravedad(val as GravedadAlergia)}
            options={[
              { value: 'leve', label: 'Leve' },
              { value: 'moderada', label: 'Moderada' },
              { value: 'grave', label: 'Grave' },
              { value: 'potencialmente_mortal', label: 'Potencialmente Mortal' },
            ]}
            colorTheme={indigoSelectTheme}
          />
        </div>

        <Input
          label="Fecha de Diagnóstico (Opcional)"
          type="date"
          value={fechaDiagnostico}
          onChange={(e) => setFechaDiagnostico(e.target.value)}
          colorTheme={indigoInputTheme}
          icon={<Calendar className="w-5 h-5" />}
        />

        <div className="md:col-span-2">
          <Input
            label="Notas / Observaciones (Opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Detalles sobre pruebas diagnósticas (Prick test), pautas o medicación de rescate..."
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
          {initialData ? 'Guardar Cambios' : 'Añadir Registro'}
        </Button>
      </div>
    </form>
  );
};

