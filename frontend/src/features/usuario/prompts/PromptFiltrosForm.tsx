import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useAjustes } from '../../../context/AjustesContext';
import {
  type ModuloPromptKey,
  MODULOS_PROMPT_INFO,
} from './promptModularTemplate';
import {
  User,
  Scale,
  Footprints,
  Dumbbell,
  Moon,
  Droplet,
  Pill,
  Wine,
  ShieldAlert,
  Activity,
  Sparkles,
  X,
  Sliders,
} from 'lucide-react';

interface PromptFiltrosFormProps {
  onGenerar: (
    motivo: string,
    modulosActivos: Record<ModuloPromptKey, boolean>
  ) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PromptFiltrosForm: React.FC<PromptFiltrosFormProps> = ({
  onGenerar,
  onCancel,
  isLoading = false,
}) => {
  const { ajustes } = useAjustes();
  const seguimientoReglaActivo = ajustes['mostrar_regla'] !== 'false';

  const [motivo, setMotivo] = useState('');

  // Estado para saber si cada módulo está seleccionado o no
  const [modulosActivos, setModulosActivos] = useState<Record<ModuloPromptKey, boolean>>({
    perfil_biometrico: true,
    composicion_corporal: true,
    actividad_pasos: true,
    entrenamiento_biomecanica: true,
    sueno_circadiano: true,
    ciclo_menstrual: seguimientoReglaActivo,
    farmacologia_suplementacion: true,
    toxicos_habitos: true,
    antecedentes_inmunologicos: true,
    sintomas: true,
  });

  const modulosDisponibles = MODULOS_PROMPT_INFO.filter((modulo) => {
    if (modulo.condicionalRegla && !seguimientoReglaActivo) {
      return false;
    }
    return true;
  });

  const handleToggleModulo = (key: ModuloPromptKey) => {
    setModulosActivos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getIconoModulo = (key: ModuloPromptKey) => {
    switch (key) {
      case 'perfil_biometrico':
        return <User className="w-5 h-5 text-indigo-600" />;
      case 'composicion_corporal':
        return <Scale className="w-5 h-5 text-cyan-600" />;
      case 'actividad_pasos':
        return <Footprints className="w-5 h-5 text-emerald-600" />;
      case 'entrenamiento_biomecanica':
        return <Dumbbell className="w-5 h-5 text-amber-600" />;
      case 'sueno_circadiano':
        return <Moon className="w-5 h-5 text-violet-600" />;
      case 'ciclo_menstrual':
        return <Droplet className="w-5 h-5 text-pink-500" />;
      case 'farmacologia_suplementacion':
        return <Pill className="w-5 h-5 text-rose-500" />;
      case 'toxicos_habitos':
        return <Wine className="w-5 h-5 text-orange-600" />;
      case 'antecedentes_inmunologicos':
        return <ShieldAlert className="w-5 h-5 text-blue-600" />;
      case 'sintomas':
        return <Activity className="w-5 h-5 text-red-600" />;
    }
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onGenerar(motivo, modulosActivos);
  };

  const handleMarcarTodos = (marcar: boolean) => {
    setModulosActivos((prev) => {
      const nuevo = { ...prev };
      for (const m of modulosDisponibles) {
        nuevo[m.key] = marcar;
      }
      return nuevo;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[75vh]">
      {/* CONTENEDOR CON SCROLL: MÓDULOS ARRIBA Y MOTIVO ABAJO */}
      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1 pb-4 flex-1">
        {/* SECCIÓN 1: SELECCIÓN Y FILTROS POR MÓDULO */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
            <div>
              <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Módulos Clínicos y Filtros</span>
              </h4>
              <p className="text-xs text-slate-500">
                Marca los módulos que deseas incluir en el prompt para desplegar y configurar sus filtros.
              </p>
            </div>

            {/* OPCIONES PARA MARCAR / DESMARCAR TODOS */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
              <button
                type="button"
                onClick={() => handleMarcarTodos(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Marcar todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handleMarcarTodos(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Desmarcar todos
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {modulosDisponibles.map((item) => {
              const estaActivo = !!modulosActivos[item.key];
              const cardBg = estaActivo
                ? 'bg-indigo-50/30 border-indigo-200 shadow-xs'
                : 'bg-slate-50/60 border-slate-200/80 opacity-80';

              return (
                <div
                  key={item.key}
                  className={`p-3.5 rounded-xl border transition-all duration-200 space-y-3 ${cardBg}`}
                >
                  {/* CABECERA DEL MÓDULO CON CHECK A LA IZQUIERDA */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={estaActivo}
                        onChange={() => handleToggleModulo(item.key)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />

                      <div className="p-2 rounded-lg bg-white shadow-xs border border-slate-100 shrink-0">
                        {getIconoModulo(item.key)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                          {item.nombre}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.descripcion}
                        </p>
                      </div>
                    </label>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 border ${
                        estaActivo
                          ? 'bg-indigo-100/70 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {estaActivo ? 'Incluido' : 'No incluido'}
                    </span>
                  </div>

                  {/* FILTROS DESPLEGABLES DEL MÓDULO (SOLO SI ESTÁ INCLUIDO) */}
                  {estaActivo && (
                    <div className="pt-3 border-t border-indigo-100/80 animate-in fade-in duration-150">
                      <div className="p-3 bg-white/90 border border-indigo-100 rounded-lg text-xs text-slate-600 space-y-1">
                        <span className="font-semibold text-indigo-900 block">
                          Filtros de {item.nombre}:
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Configuración y filtros específicos activos para este módulo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 2: MOTIVO DE LA CONSULTA (ABAJO DEL TODO) */}
        <div className="flex flex-col space-y-2 pt-2 border-t border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="motivo-consulta-modular"
              className="text-sm font-bold text-slate-700 flex items-center gap-1.5"
            >
              <span>Motivo de la consulta</span>
              <span className="text-slate-400 font-normal text-xs">(Opcional para predictivos)</span>
            </label>

            {motivo.length > 0 && (
              <button
                type="button"
                onClick={() => setMotivo('')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Borrar texto del motivo"
              >
                <X className="w-3.5 h-3.5" />
                <span>Borrar texto</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Describe la situación específica a analizar, o déjalo en blanco si se trata de un análisis periódico o predictivo.
          </p>

          <textarea
            id="motivo-consulta-modular"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Escribe el motivo clínico o consulta aquí..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all resize-y min-h-[80px]"
          />
        </div>
      </div>

      {/* FOOTER FIJO CON BOTONES */}
      <div className="sticky bottom-0 bg-white pt-4 border-t border-slate-100 flex justify-end gap-3 z-10 shrink-0">
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

