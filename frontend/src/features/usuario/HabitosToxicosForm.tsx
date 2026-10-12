import React, { useState, useEffect, useCallback } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';
import { Wine, Cigarette, Coffee, Zap, AlertOctagon, HelpCircle, Flame } from 'lucide-react';

export type EstadoConsumoHabito = 'no_consume' | 'consumo_activo' | 'ex_consumidor';

export type FrecuenciaConsumo =
  | 'diario'
  | 'semanal'
  | 'fin_de_semana'
  | 'ocasional'
  | 'social';

export interface HabitoToxicoItem {
  id?: string;
  clave: string;
  nombre: string;
  categoria: string;
  estado: EstadoConsumoHabito;
  frecuencia: FrecuenciaConsumo | null;
  cantidad: string | null;
  notas: string | null;
}

export const HABITOS_BASE: HabitoToxicoItem[] = [
  { clave: 'cafeina', nombre: 'Cafeína (Café, té)', categoria: 'habito', estado: 'no_consume', frecuencia: null, cantidad: null, notas: null },
  { clave: 'bebidas_energeticas', nombre: 'Bebidas energéticas', categoria: 'habito', estado: 'no_consume', frecuencia: null, cantidad: null, notas: null },
  { clave: 'tabaco', nombre: 'Tabaco (Cigarrillos / Puros)', categoria: 'toxico', estado: 'no_consume', frecuencia: null, cantidad: null, notas: null },
  { clave: 'vapeo', nombre: 'Cigarrillo electrónico / Vapeo', categoria: 'toxico', estado: 'no_consume', frecuencia: null, cantidad: null, notas: null },
  { clave: 'alcohol', nombre: 'Alcohol (Cerveza, vino, destilados)', categoria: 'toxico', estado: 'no_consume', frecuencia: null, cantidad: null, notas: null },
  { clave: 'cannabis', nombre: 'Cannabis / Derivados', categoria: 'toxico', estado: 'no_consume', frecuencia: null, cantidad: null, notas: null },
  { clave: 'otras_sustancias', nombre: 'Otras sustancias / Tóxicos', categoria: 'toxico', estado: 'no_consume', frecuencia: null, cantidad: null, notas: null },
];

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

interface HabitosToxicosFormProps {
  initialData?: HabitoToxicoItem[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const HabitosToxicosForm: React.FC<HabitosToxicosFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [habitos, setHabitos] = useState<HabitoToxicoItem[]>(initialData || HABITOS_BASE);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarHabitos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<HabitoToxicoItem[]>('/habitos-toxicos');
      if (res.data && res.data.length > 0) {
        const mapExistentes = new Map(res.data.map(item => [item.clave, item]));
        const listaCompleta = HABITOS_BASE.map(base => {
          const existente = mapExistentes.get(base.clave);
          return existente ? { ...existente } : base;
        });
        setHabitos(listaCompleta);
      }
    } catch (err: unknown) {
      console.error('Error al cargar hábitos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      cargarHabitos();
    } else {
      setHabitos(initialData);
      setIsLoading(false);
    }
  }, [initialData, cargarHabitos]);

  const handleEstadoChange = (clave: string, nuevoEstado: EstadoConsumoHabito) => {
    setHabitos(prev =>
      prev.map(item => {
        if (item.clave !== clave) return item;
        return {
          ...item,
          estado: nuevoEstado,
          frecuencia: nuevoEstado === 'no_consume' ? null : (item.frecuencia || 'diario'),
          cantidad: nuevoEstado === 'no_consume' ? null : item.cantidad,
          notas: nuevoEstado === 'no_consume' ? null : item.notas,
        };
      })
    );
  };

  const handleCampoChange = (
    clave: string,
    campo: 'frecuencia' | 'cantidad' | 'notas',
    valor: string | null
  ) => {
    setHabitos(prev =>
      prev.map(item => {
        if (item.clave !== clave) return item;
        return { ...item, [campo]: valor };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = habitos.map(h => ({
        clave: h.clave,
        nombre: h.nombre,
        categoria: h.categoria,
        estado: h.estado,
        frecuencia: h.estado === 'no_consume' ? null : h.frecuencia,
        cantidad: h.estado === 'no_consume' ? null : (h.cantidad?.trim() || null),
        notas: h.estado === 'no_consume' ? null : (h.notas?.trim() || null),
      }));

      await apiClient.put('/habitos-toxicos', payload);
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError('Error al guardar los hábitos y tóxicos.');
    } finally {
      setIsSaving(false);
    }
  };

  const getIcono = (clave: string) => {
    switch (clave) {
      case 'tabaco': return <Cigarette className="w-5 h-5 text-amber-600" />;
      case 'vapeo': return <Flame className="w-5 h-5 text-indigo-500" />;
      case 'alcohol': return <Wine className="w-5 h-5 text-rose-500" />;
      case 'cafeina': return <Coffee className="w-5 h-5 text-amber-800" />;
      case 'bebidas_energeticas': return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'cannabis': return <AlertOctagon className="w-5 h-5 text-emerald-600" />;
      default: return <HelpCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-indigo-500 animate-pulse font-medium">
        Cargando hábitos basales...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
        {habitos.map(item => {
          const consume = item.estado !== 'no_consume';
          const cardBg = consume
            ? item.estado === 'consumo_activo'
              ? 'bg-amber-50/40 border-amber-200'
              : 'bg-indigo-50/40 border-indigo-200'
            : 'bg-slate-50/50 border-slate-200/80';

          return (
            <div
              key={item.clave}
              className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${cardBg}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                    {getIcono(item.clave)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">
                      {item.nombre}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {item.categoria === 'toxico' ? 'Tóxico / Sustancia' : 'Hábito Nutricional'}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-52">
                  <Select
                    value={item.estado}
                    onChange={(val) => handleEstadoChange(item.clave, val as EstadoConsumoHabito)}
                    options={[
                      { value: 'no_consume', label: 'No consume' },
                      { value: 'consumo_activo', label: 'Consume actualmente' },
                      { value: 'ex_consumidor', label: 'Ex-consumidor' },
                    ]}
                    colorTheme={indigoSelectTheme}
                  />
                </div>
              </div>

              {consume && (
                <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-slate-600 pl-1">Frecuencia</label>
                    <Select
                      value={item.frecuencia || 'diario'}
                      onChange={(val) => handleCampoChange(item.clave, 'frecuencia', val as FrecuenciaConsumo)}
                      options={[
                        { value: 'diario', label: 'Diario' },
                        { value: 'semanal', label: 'Semanal' },
                        { value: 'fin_de_semana', label: 'Fines de semana' },
                        { value: 'social', label: 'Social / Eventos' },
                        { value: 'ocasional', label: 'Esporádico / Ocasional' },
                      ]}
                      colorTheme={indigoSelectTheme}
                    />
                  </div>

                  <Input
                    label="Cantidad aproximada"
                    placeholder="Ej. 1 paquete/día, 2 cafés..."
                    value={item.cantidad || ''}
                    onChange={(e) => handleCampoChange(item.clave, 'cantidad', e.target.value)}
                    colorTheme={indigoInputTheme}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Observaciones o Tiempo (Opcional)"
                      placeholder={item.estado === 'ex_consumidor' ? 'Ej. Lo dejó en 2022 tras 10 años fumando' : 'Ej. Solo con amigos, marcas, etc.'}
                      value={item.notas || ''}
                      onChange={(e) => handleCampoChange(item.clave, 'notas', e.target.value)}
                      colorTheme={indigoInputTheme}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSaving}
          colorTheme={{
            bgNormal: 'bg-indigo-600',
            bgHover: 'hover:bg-indigo-700',
            textColor: 'text-white',
            focusRing: 'focus:ring-indigo-500',
          }}
          className="px-6"
        >
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
};
