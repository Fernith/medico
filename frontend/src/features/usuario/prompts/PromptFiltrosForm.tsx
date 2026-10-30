import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { useAjustes } from '../../../context/AjustesContext';
import {
  type ModuloPromptKey,
  type TipoPromptModular,
  type FiltrosModulo7Farmacologia,
  type FiltrosModulo9Antecedentes,
  type FiltrosModulo10Sintomas,
  type VentanaDiasTriajeSintomas,
  type VentanaDiasPredictivoSintomas,
  type MinRepeticionesPredictivoSintomas,
  MODULOS_PROMPT_INFO,
} from './promptModularTemplate';
import {
  type OpcionesFiltroModulo7,
  obtenerOpcionesFiltroModulo7,
} from '../../../utils/prompts/modulo7FarmacologiaCalculations';
import {
  type OpcionAntecedenteModulo9,
  obtenerOpcionesFiltroModulo9,
} from '../../../utils/prompts/modulo9AntecedentesCalculations';
import {
  fetchTodasLasOcurrenciasSintomas,
  construirOpcionesTriajeMod10,
  construirOpcionesPredictivoMod10,
} from '../../../utils/prompts/modulo10SintomasCalculations';
import { type OcurrenciaSintoma } from '../../sintomas/SintomasTabla';
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
  Stethoscope,
  TrendingUp,
} from 'lucide-react';

interface PromptFiltrosFormProps {
  onGenerar: (
    tipo: TipoPromptModular,
    motivo: string,
    modulosActivos: Record<ModuloPromptKey, boolean>,
    filtrosModulo7: FiltrosModulo7Farmacologia,
    filtrosModulo9: FiltrosModulo9Antecedentes,
    filtrosModulo10: FiltrosModulo10Sintomas
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

  const [tipoPrompt, setTipoPrompt] = useState<TipoPromptModular>('triaje');
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

  // Estado y opciones del Módulo 7 (Farmacología y Suplementación)
  const [opcionesMod7, setOpcionesMod7] = useState<OpcionesFiltroModulo7>({
    farmacosActivos: [],
    suplementosActivos: [],
    tomasPuntuales: [],
  });
  const [cargandoMod7, setCargandoMod7] = useState<boolean>(true);
  const [filtrosModulo7, setFiltrosModulo7] = useState<FiltrosModulo7Farmacologia>({
    incluirFarmacosActivos: true,
    farmacosActivosIds: [],
    incluirSuplementosActivos: true,
    suplementosActivosIds: [],
    incluirTomasPuntuales: true,
    tomasPuntualesMedicamentoIds: [],
  });

  // Estado y opciones del Módulo 9 (Antecedentes Familiares)
  const [opcionesMod9, setOpcionesMod9] = useState<OpcionAntecedenteModulo9[]>([]);
  const [cargandoMod9, setCargandoMod9] = useState<boolean>(true);
  const [filtrosModulo9, setFiltrosModulo9] = useState<FiltrosModulo9Antecedentes>({
    antecedentesIds: [],
  });

  // Estado y opciones del Módulo 10 (Síntomas 10A Triaje / 10B Predictivo)
  const [ocurrenciasMod10, setOcurrenciasMod10] = useState<OcurrenciaSintoma[]>([]);
  const [cargandoMod10, setCargandoMod10] = useState<boolean>(true);
  const [filtrosModulo10, setFiltrosModulo10] = useState<FiltrosModulo10Sintomas>({
    ventanaDiasTriaje: 7,
    sintomasSeleccionadosIds: [],
    ventanaDiasPredictivo: 180,
    minRepeticionesPredictivo: 2,
    focosSeleccionadosClaves: [],
  });

  useEffect(() => {
    let montado = true;
    obtenerOpcionesFiltroModulo7()
      .then((op) => {
        if (!montado) return;
        setOpcionesMod7(op);
        setFiltrosModulo7({
          incluirFarmacosActivos: true,
          farmacosActivosIds: op.farmacosActivos.map((f) => f.id),
          incluirSuplementosActivos: true,
          suplementosActivosIds: op.suplementosActivos.map((s) => s.id),
          incluirTomasPuntuales: true,
          tomasPuntualesMedicamentoIds: op.tomasPuntuales.map((t) => t.id),
        });
      })
      .finally(() => {
        if (montado) setCargandoMod7(false);
      });

    obtenerOpcionesFiltroModulo9()
      .then((op9) => {
        if (!montado) return;
        setOpcionesMod9(op9);
        setFiltrosModulo9({
          antecedentesIds: op9.map((a) => a.id),
        });
      })
      .finally(() => {
        if (montado) setCargandoMod9(false);
      });

    fetchTodasLasOcurrenciasSintomas()
      .then((todas) => {
        if (!montado) return;
        setOcurrenciasMod10(todas);
        const triajeInicial = construirOpcionesTriajeMod10(todas, 7);
        const predictivoInicial = construirOpcionesPredictivoMod10(todas, 180, 2);
        setFiltrosModulo10({
          ventanaDiasTriaje: 7,
          sintomasSeleccionadosIds: triajeInicial.map((s) => s.id),
          ventanaDiasPredictivo: 180,
          minRepeticionesPredictivo: 2,
          focosSeleccionadosClaves: predictivoInicial.map((f) => f.clave),
        });
      })
      .finally(() => {
        if (montado) setCargandoMod10(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  const opcionesTriajeMod10 = construirOpcionesTriajeMod10(
    ocurrenciasMod10,
    filtrosModulo10.ventanaDiasTriaje
  );
  const opcionesPredictivoMod10 = construirOpcionesPredictivoMod10(
    ocurrenciasMod10,
    filtrosModulo10.ventanaDiasPredictivo,
    filtrosModulo10.minRepeticionesPredictivo
  );

  const handleCambiarVentanaTriajeMod10 = (nuevaVentana: VentanaDiasTriajeSintomas) => {
    const nuevasOpciones = construirOpcionesTriajeMod10(ocurrenciasMod10, nuevaVentana);
    setFiltrosModulo10((prev) => ({
      ...prev,
      ventanaDiasTriaje: nuevaVentana,
      sintomasSeleccionadosIds: nuevasOpciones.map((s) => s.id),
    }));
  };

  const handleCambiarParametrosPredictivoMod10 = (
    nuevaVentana: VentanaDiasPredictivoSintomas,
    nuevoMin: MinRepeticionesPredictivoSintomas
  ) => {
    const nuevasOpciones = construirOpcionesPredictivoMod10(
      ocurrenciasMod10,
      nuevaVentana,
      nuevoMin
    );
    setFiltrosModulo10((prev) => ({
      ...prev,
      ventanaDiasPredictivo: nuevaVentana,
      minRepeticionesPredictivo: nuevoMin,
      focosSeleccionadosClaves: nuevasOpciones.map((f) => f.clave),
    }));
  };

  const toggleIdEnLista = (lista: string[], id: string): string[] => {
    return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerar(
      tipoPrompt,
      tipoPrompt === 'triaje' ? motivo : '',
      modulosActivos,
      filtrosModulo7,
      filtrosModulo9,
      filtrosModulo10
    );
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
      {/* CABECERA FIJA CON SELECTOR DE TIPO DE PROMPT */}
      <div className="shrink-0 pb-3 border-b border-indigo-100 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            Tipo de consulta clínica
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {tipoPrompt === 'triaje' ? 'Consulta por síntoma agudo' : 'Análisis longitudinal preventivo'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setTipoPrompt('triaje')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipoPrompt === 'triaje'
                ? 'bg-white text-indigo-900 shadow-sm border border-indigo-200'
                : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-200/50'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">Triaje (Problema actual)</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoPrompt('predictivo')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipoPrompt === 'predictivo'
                ? 'bg-white text-indigo-900 shadow-sm border border-indigo-200'
                : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-200/50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">Predictivo (Medicina preventiva)</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR CON SCROLL: MÓDULOS Y MOTIVO (SI TRIAJE) */}
      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1 pt-3 pb-4 flex-1">
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

                  {/* FILTROS DESPLEGABLES DEL MÓDULO (SOLO SI TIENE FILTROS Y ESTÁ INCLUIDO) */}
                  {estaActivo && item.tieneFiltros !== false && (
                    <div className="pt-3 border-t border-indigo-100/80 animate-in fade-in duration-150">
                      {item.key === 'farmacologia_suplementacion' ? (
                        <div className="p-3 bg-white/95 border border-indigo-100 rounded-lg text-xs text-slate-700 space-y-3">
                          {cargandoMod7 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              Cargando medicación, suplementos e historial...
                            </p>
                          ) : (
                            <>
                              {/* 1. MEDICACIÓN ACTIVA */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 font-bold text-indigo-950 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={filtrosModulo7.incluirFarmacosActivos}
                                    onChange={(e) =>
                                      setFiltrosModulo7((prev) => ({
                                        ...prev,
                                        incluirFarmacosActivos: e.target.checked,
                                      }))
                                    }
                                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span>Incluir medicación activa ({opcionesMod7.farmacosActivos.length})</span>
                                </label>

                                {filtrosModulo7.incluirFarmacosActivos && (
                                  <div className="pl-5 space-y-1.5">
                                    {opcionesMod7.farmacosActivos.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">
                                        No hay fármacos activos registrados actualmente.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {opcionesMod7.farmacosActivos.map((med) => {
                                          const checked = filtrosModulo7.farmacosActivosIds.includes(med.id);
                                          return (
                                            <label
                                              key={med.id}
                                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                                                checked
                                                  ? 'bg-indigo-50/50 border-indigo-200 text-slate-800'
                                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                  setFiltrosModulo7((prev) => ({
                                                    ...prev,
                                                    farmacosActivosIds: toggleIdEnLista(
                                                      prev.farmacosActivosIds,
                                                      med.id
                                                    ),
                                                  }))
                                                }
                                                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                              />
                                              <div className="min-w-0 flex-1">
                                                <span className="font-semibold block truncate">
                                                  {med.nombre}
                                                </span>
                                                <span className="text-[10px] text-slate-500 block truncate">
                                                  {med.detalle}
                                                </span>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* 2. SUPLEMENTACIÓN NUTRICIONAL */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 font-bold text-indigo-950 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={filtrosModulo7.incluirSuplementosActivos}
                                    onChange={(e) =>
                                      setFiltrosModulo7((prev) => ({
                                        ...prev,
                                        incluirSuplementosActivos: e.target.checked,
                                      }))
                                    }
                                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span>Incluir suplementación ({opcionesMod7.suplementosActivos.length})</span>
                                </label>

                                {filtrosModulo7.incluirSuplementosActivos && (
                                  <div className="pl-5 space-y-1.5">
                                    {opcionesMod7.suplementosActivos.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">
                                        No hay suplementos activos registrados actualmente.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {opcionesMod7.suplementosActivos.map((sup) => {
                                          const checked = filtrosModulo7.suplementosActivosIds.includes(sup.id);
                                          return (
                                            <label
                                              key={sup.id}
                                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                                                checked
                                                  ? 'bg-indigo-50/50 border-indigo-200 text-slate-800'
                                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                  setFiltrosModulo7((prev) => ({
                                                    ...prev,
                                                    suplementosActivosIds: toggleIdEnLista(
                                                      prev.suplementosActivosIds,
                                                      sup.id
                                                    ),
                                                  }))
                                                }
                                                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                              />
                                              <div className="min-w-0 flex-1">
                                                <span className="font-semibold block truncate">
                                                  {sup.nombre}
                                                </span>
                                                <span className="text-[10px] text-slate-500 block truncate">
                                                  {sup.detalle}
                                                </span>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* 3. TOMAS PUNTUALES / RESCATE (ÚLTIMOS 14 DÍAS) */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 font-bold text-indigo-950 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={filtrosModulo7.incluirTomasPuntuales}
                                    onChange={(e) =>
                                      setFiltrosModulo7((prev) => ({
                                        ...prev,
                                        incluirTomasPuntuales: e.target.checked,
                                      }))
                                    }
                                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span>
                                    Incluir tomas puntuales recientes - 14d ({opcionesMod7.tomasPuntuales.length})
                                  </span>
                                </label>

                                {filtrosModulo7.incluirTomasPuntuales && (
                                  <div className="pl-5 space-y-1.5">
                                    {opcionesMod7.tomasPuntuales.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">
                                        Sin medicinas puntuales fuera de pauta en los últimos 14 días.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {opcionesMod7.tomasPuntuales.map((punt) => {
                                          const checked =
                                            filtrosModulo7.tomasPuntualesMedicamentoIds.includes(
                                              punt.id
                                            );
                                          return (
                                            <label
                                              key={punt.id}
                                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                                                checked
                                                  ? 'bg-indigo-50/50 border-indigo-200 text-slate-800'
                                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                  setFiltrosModulo7((prev) => ({
                                                    ...prev,
                                                    tomasPuntualesMedicamentoIds: toggleIdEnLista(
                                                      prev.tomasPuntualesMedicamentoIds,
                                                      punt.id
                                                    ),
                                                  }))
                                                }
                                                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                              />
                                              <div className="min-w-0 flex-1">
                                                <span className="font-semibold block truncate">
                                                  {punt.nombre}
                                                </span>
                                                <span className="text-[10px] text-slate-500 block truncate">
                                                  {punt.detalle}
                                                </span>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : item.key === 'antecedentes_inmunologicos' ? (
                        <div className="p-3 bg-white/95 border border-indigo-100 rounded-lg text-xs text-slate-700 space-y-2.5">
                          {cargandoMod9 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              Cargando antecedentes familiares...
                            </p>
                          ) : opcionesMod9.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              No hay antecedentes familiares registrados en la base de datos (la subsección no se mostrará).
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-indigo-950">
                                  Antecedentes familiares a mostrar ({filtrosModulo9.antecedentesIds.length}/{opcionesMod9.length})
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFiltrosModulo9({
                                        antecedentesIds: opcionesMod9.map((a) => a.id),
                                      })
                                    }
                                    className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                  >
                                    Todos
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFiltrosModulo9({
                                        antecedentesIds: [],
                                      })
                                    }
                                    className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                                  >
                                    Ninguno
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {opcionesMod9.map((ant) => {
                                  const checked = filtrosModulo9.antecedentesIds.includes(ant.id);
                                  return (
                                    <label
                                      key={ant.id}
                                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                                        checked
                                          ? 'bg-indigo-50/50 border-indigo-200 text-slate-800'
                                          : 'bg-slate-50 border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          setFiltrosModulo9((prev) => ({
                                            ...prev,
                                            antecedentesIds: toggleIdEnLista(
                                              prev.antecedentesIds,
                                              ant.id
                                            ),
                                          }))
                                        }
                                        className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <span className="font-semibold block truncate">
                                          {ant.parentescoLabel}: {ant.enfermedad}
                                        </span>
                                        <span className="text-[10px] text-slate-500 block truncate">
                                          {ant.detalle}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>

                              {filtrosModulo9.antecedentesIds.length === 0 && (
                                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                                  Al deseleccionar todos los antecedentes registrados, se indicará en el prompt que no repercuten ni influyen en esta consulta.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : item.key === 'sintomas' ? (
                        <div className="p-3 bg-white/95 border border-indigo-100 rounded-lg text-xs text-slate-700 space-y-3">
                          {cargandoMod10 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              Cargando historial de síntomas...
                            </p>
                          ) : tipoPrompt === 'triaje' ? (
                            /* MODO 10A: TRIAJE (SÍNTOMAS RECIENTES) */
                            <div className="space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <span className="font-bold text-indigo-950">
                                  Ventana de síntomas recientes (10A - Triaje):
                                </span>
                                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 self-start sm:self-auto">
                                  {([7, 14, 30] as VentanaDiasTriajeSintomas[]).map((dias) => {
                                    const activo = filtrosModulo10.ventanaDiasTriaje === dias;
                                    return (
                                      <button
                                        key={dias}
                                        type="button"
                                        onClick={() => handleCambiarVentanaTriajeMod10(dias)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                          activo
                                            ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                                            : 'text-slate-600 hover:text-indigo-700'
                                        }`}
                                      >
                                        Últimos {dias}d
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {opcionesTriajeMod10.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">
                                  No hay síntomas registrados en los últimos {filtrosModulo10.ventanaDiasTriaje} días. Se indicará en el prompt que no ha habido ningún síntoma en este periodo.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-700">
                                      Síntomas vinculados a incluir ({filtrosModulo10.sintomasSeleccionadosIds.length}/{opcionesTriajeMod10.length})
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFiltrosModulo10((prev) => ({
                                            ...prev,
                                            sintomasSeleccionadosIds: opcionesTriajeMod10.map(
                                              (s) => s.id
                                            ),
                                          }))
                                        }
                                        className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                      >
                                        Todos
                                      </button>
                                      <span className="text-slate-300">|</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFiltrosModulo10((prev) => ({
                                            ...prev,
                                            sintomasSeleccionadosIds: [],
                                          }))
                                        }
                                        className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                                      >
                                        Ninguno
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {opcionesTriajeMod10.map((sint) => {
                                      const checked =
                                        filtrosModulo10.sintomasSeleccionadosIds.includes(sint.id);
                                      return (
                                        <label
                                          key={sint.id}
                                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                                            checked
                                              ? 'bg-indigo-50/50 border-indigo-200 text-slate-800'
                                              : 'bg-slate-50 border-slate-200 text-slate-400'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              setFiltrosModulo10((prev) => ({
                                                ...prev,
                                                sintomasSeleccionadosIds: toggleIdEnLista(
                                                  prev.sintomasSeleccionadosIds,
                                                  sint.id
                                                ),
                                              }))
                                            }
                                            className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <span className="font-semibold block truncate">
                                              {sint.zonaTexto} ({sint.sintomaNombre})
                                            </span>
                                            <span className="text-[10px] text-slate-500 block truncate">
                                              {sint.fechaLegible} • {sint.resumenValor}
                                            </span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>

                                  {filtrosModulo10.sintomasSeleccionadosIds.length === 0 && (
                                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                                      Con 0 síntomas seleccionados, el prompt indicará evaluar exclusivamente mediante el texto libre del motivo de consulta.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* MODO 10B: PREDICTIVO (MATRIZ DE RECURRENCIA 90-180 DÍAS) */
                            <div className="space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-indigo-950">
                                    Ventana (10B - Predictivo):
                                  </span>
                                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                                    {([90, 120, 180] as VentanaDiasPredictivoSintomas[]).map(
                                      (dias) => {
                                        const activo =
                                          filtrosModulo10.ventanaDiasPredictivo === dias;
                                        return (
                                          <button
                                            key={dias}
                                            type="button"
                                            onClick={() =>
                                              handleCambiarParametrosPredictivoMod10(
                                                dias,
                                                filtrosModulo10.minRepeticionesPredictivo
                                              )
                                            }
                                            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                              activo
                                                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                                                : 'text-slate-600 hover:text-indigo-700'
                                            }`}
                                          >
                                            {dias}d
                                          </button>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    Filtro:
                                  </span>
                                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                                    {([2, 1] as MinRepeticionesPredictivoSintomas[]).map((min) => {
                                      const activo =
                                        filtrosModulo10.minRepeticionesPredictivo === min;
                                      return (
                                        <button
                                          key={min}
                                          type="button"
                                          onClick={() =>
                                            handleCambiarParametrosPredictivoMod10(
                                              filtrosModulo10.ventanaDiasPredictivo,
                                              min
                                            )
                                          }
                                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                            activo
                                              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                                              : 'text-slate-600 hover:text-indigo-700'
                                          }`}
                                        >
                                          {min === 2 ? '≥ 2 episodios' : '≥ 1 (Todos)'}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {opcionesPredictivoMod10.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">
                                  Sin focos anatómicos que cumplan el criterio en los últimos {filtrosModulo10.ventanaDiasPredictivo} días.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-700">
                                      Focos corporales Nivel 2 ({filtrosModulo10.focosSeleccionadosClaves.length}/{opcionesPredictivoMod10.length})
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFiltrosModulo10((prev) => ({
                                            ...prev,
                                            focosSeleccionadosClaves: opcionesPredictivoMod10.map(
                                              (f) => f.clave
                                            ),
                                          }))
                                        }
                                        className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                      >
                                        Todos
                                      </button>
                                      <span className="text-slate-300">|</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFiltrosModulo10((prev) => ({
                                            ...prev,
                                            focosSeleccionadosClaves: [],
                                          }))
                                        }
                                        className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                                      >
                                        Ninguno
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {opcionesPredictivoMod10.map((foco) => {
                                      const checked =
                                        filtrosModulo10.focosSeleccionadosClaves.includes(
                                          foco.clave
                                        );
                                      return (
                                        <label
                                          key={foco.clave}
                                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                                            checked
                                              ? 'bg-indigo-50/50 border-indigo-200 text-slate-800'
                                              : 'bg-slate-50 border-slate-200 text-slate-400'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              setFiltrosModulo10((prev) => ({
                                                ...prev,
                                                focosSeleccionadosClaves: toggleIdEnLista(
                                                  prev.focosSeleccionadosClaves,
                                                  foco.clave
                                                ),
                                              }))
                                            }
                                            className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <span className="font-semibold block truncate">
                                              {foco.zonaLabel}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block truncate">
                                              {foco.veces} {foco.veces === 1 ? 'vez' : 'veces'} • {foco.intensidadMediaTexto} • Último: {foco.ultimoEpisodioTexto}
                                            </span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>

                                  {filtrosModulo10.focosSeleccionadosClaves.length === 0 && (
                                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                                      Con 0 focos seleccionados, el prompt indicará que no se ha seleccionado ningún foco sintomático para evaluar en esta consulta.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-white/90 border border-indigo-100 rounded-lg text-xs text-slate-600 space-y-1">
                          <span className="font-semibold text-indigo-900 block">
                            Filtros de {item.nombre}:
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Configuración y filtros específicos activos para este módulo.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 2: MOTIVO DE LA CONSULTA (SÓLO SI ES TRIAJE) */}
        {tipoPrompt === 'triaje' && (
          <div className="flex flex-col space-y-2 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="motivo-consulta-modular"
                className="text-sm font-bold text-slate-700 flex items-center gap-1.5"
              >
                <span>Motivo de la consulta</span>
                <span className="text-slate-400 font-normal text-xs">(Triaje clínico)</span>
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
              Describe los síntomas o situación clínica que deseas consultar ahora mismo.
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
        )}
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
