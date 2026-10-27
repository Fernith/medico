import React, { useState } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';
import { Activity, Calendar, Pill, FileText, CheckCircle2 } from 'lucide-react';

export type CategoriaPatologia =
  | 'cardiovascular'
  | 'respiratoria'
  | 'metabolica_endocrina'
  | 'digestiva'
  | 'neurologica'
  | 'reumatologica'
  | 'oncologica'
  | 'dermatologica'
  | 'salud_mental'
  | 'otra';

export type EstadoPatologia =
  | 'activa'
  | 'controlada'
  | 'en_remision'
  | 'resuelta';

export interface Patologia {
  id: string;
  nombre: string;
  categoria: CategoriaPatologia;
  estado: EstadoPatologia;
  fecha_diagnostico: string | null;
  tratamiento_actual: string | null;
  notas: string | null;
}

interface PatologiaFormProps {
  initialData?: Patologia | null;
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

export const PatologiaForm: React.FC<PatologiaFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [categoria, setCategoria] = useState<CategoriaPatologia>(initialData?.categoria || 'cardiovascular');
  const [estado, setEstado] = useState<EstadoPatologia>(initialData?.estado || 'activa');
  const [fechaDiagnostico, setFechaDiagnostico] = useState(initialData?.fecha_diagnostico || '');
  const [tratamientoActual, setTratamientoActual] = useState(initialData?.tratamiento_actual || '');
  const [notas, setNotas] = useState(initialData?.notas || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Por favor indica el nombre de la patología.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      nombre: nombre.trim(),
      categoria,
      estado,
      fecha_diagnostico: fechaDiagnostico || null,
      tratamiento_actual: tratamientoActual.trim() || null,
      notas: notas.trim() || null,
    };

    try {
      if (initialData?.id) {
        await apiClient.put(`/patologias/${initialData.id}`, payload);
      } else {
        await apiClient.post('/patologias', payload);
      }
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError('Error al guardar la patología.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input
            label="Nombre de la Patología o Condición"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Hipertensión arterial, Diabetes mellitus tipo 2, Hipotiroidismo, Asma..."
            required
            colorTheme={indigoInputTheme}
            icon={<Activity className="w-5 h-5" />}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Categoría Médica</label>
          <Select
            value={categoria}
            onChange={(val) => setCategoria(val as CategoriaPatologia)}
            options={[
              { value: 'cardiovascular', label: 'Cardiovascular' },
              { value: 'respiratoria', label: 'Respiratoria' },
              { value: 'metabolica_endocrina', label: 'Metabólica / Endocrina' },
              { value: 'digestiva', label: 'Digestiva' },
              { value: 'neurologica', label: 'Neurológica' },
              { value: 'reumatologica', label: 'Reumatológica / Osteoarticular' },
              { value: 'oncologica', label: 'Oncológica' },
              { value: 'dermatologica', label: 'Dermatológica' },
              { value: 'salud_mental', label: 'Salud Mental' },
              { value: 'otra', label: 'Otra' },
            ]}
            colorTheme={indigoSelectTheme}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Estado Clínico</label>
          <Select
            value={estado}
            onChange={(val) => setEstado(val as EstadoPatologia)}
            options={[
              { value: 'activa', label: 'Activa (Sin control completo)' },
              { value: 'controlada', label: 'Controlada (Bajo tratamiento)' },
              { value: 'en_remision', label: 'En remisión' },
              { value: 'resuelta', label: 'Resuelta / Curada' },
            ]}
            colorTheme={indigoSelectTheme}
            icon={<CheckCircle2 className="w-5 h-5 text-indigo-500" />}
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
            label="Tratamiento Actual / Manejo (Opcional)"
            value={tratamientoActual}
            onChange={(e) => setTratamientoActual(e.target.value)}
            placeholder="Ej. Enalapril 20mg diario, dieta baja en sodio, control analítico cada 6 meses..."
            colorTheme={indigoInputTheme}
            icon={<Pill className="w-5 h-5" />}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Notas / Seguimiento (Opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Especialista asignado, pruebas periódicas, antecedentes clínicos..."
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
          {initialData ? 'Guardar Cambios' : 'Añadir Patología'}
        </Button>
      </div>
    </form>
  );
};

