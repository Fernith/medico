import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  type ValoresBasalesPrompt,
  obtenerValoresBasalesStorage,
  guardarValoresBasalesStorage,
  restablecerValoresBasalesStorage,
} from './promptStorage';
import { RotateCcw, Save, Sliders, Check } from 'lucide-react';

interface PromptConfiguracionModalProps {
  onCerrar: () => void;
  onGuardado?: () => void;
}

export const PromptConfiguracionModal: React.FC<PromptConfiguracionModalProps> = ({
  onCerrar,
  onGuardado,
}) => {
  const [valores, setValores] = useState<ValoresBasalesPrompt>(() => obtenerValoresBasalesStorage());
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    if (mensajeExito) {
      const timer = setTimeout(() => setMensajeExito(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [mensajeExito]);

  const handleChange = (campo: keyof ValoresBasalesPrompt, texto: string) => {
    setValores((prev) => ({ ...prev, [campo]: texto }));
    setMensajeExito(null);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    guardarValoresBasalesStorage(valores);
    setMensajeExito('Parámetros basales guardados correctamente.');
    if (onGuardado) onGuardado();
  };

  const handleRestablecer = () => {
    const defaultVals = restablecerValoresBasalesStorage();
    setValores(defaultVals);
    setMensajeExito('Valores originales restablecidos.');
  };

  return (
    <form onSubmit={handleGuardar} className="space-y-6">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm sm:text-base">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <span>Configuración de Parámetros Basales Clínicos</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Estos valores se usan en la plantilla del prompt para aquellas secciones fisiológicas que aún no disponen de una tabla en la base de datos. Puedes modificarlos en cualquier momento; se conservarán guardados en tu navegador.
      </p>

      {mensajeExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* CONTENEDOR CON SCROLL PARA LOS CAMPOS */}
      <div className="space-y-6 max-h-[58vh] overflow-y-auto custom-scrollbar pr-1">
        {/* SECCIÓN 1: INMUNOLÓGICO Y QUIRÚRGICO */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            1. Antecedentes Quirúrgicos
          </h4>
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-700">Cirugías y Cicatrización</label>
            <textarea
              rows={2}
              value={valores.antecedentesQuirurgicos}
              onChange={(e) => handleChange('antecedentesQuirurgicos', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>
        </div>

        {/* SECCIÓN 2: ENDOCRINO Y METABÓLICO */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            2. Estado Basal Endocrino y Metabólico
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Estado Tiroideo (TSH, síntomas)</label>
              <textarea
                rows={2}
                value={valores.estadoTiroideo}
                onChange={(e) => handleChange('estadoTiroideo', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Regulación de la Glucosa (Ayunas, reactividad)</label>
              <textarea
                rows={2}
                value={valores.regulacionGlucosa}
                onChange={(e) => handleChange('regulacionGlucosa', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Salud Reproductiva (Ciclo, síntomas basales)</label>
              <textarea
                rows={2}
                value={valores.saludReproductiva}
                onChange={(e) => handleChange('saludReproductiva', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: CARDIOVASCULAR Y HEMODINÁMICO */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            3. Cardiovascular y Hemodinámico
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Perfil Lipídico (LDL, HDL, Triglicéridos)</label>
              <textarea
                rows={2}
                value={valores.perfilLipidico}
                onChange={(e) => handleChange('perfilLipidico', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tolerancia Ortostática e Hidratación</label>
              <textarea
                rows={2}
                value={valores.toleranciaOrtostatica}
                onChange={(e) => handleChange('toleranciaOrtostatica', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: NEUROLÓGICO Y SUEÑO */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            4. Arquitectura Neurológica y del Sueño
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Calidad y Arquitectura del Sueño</label>
              <textarea
                rows={2}
                value={valores.sueno}
                onChange={(e) => handleChange('sueno', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Cefaleas y Sensibilidad Barométrica</label>
              <textarea
                rows={2}
                value={valores.cefaleas}
                onChange={(e) => handleChange('cefaleas', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: MUSCULOESQUELÉTICO Y GASTROINTESTINAL */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            5. Musculoesquelético y Gastrointestinal
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Biomecánica y Postura</label>
              <textarea
                rows={2}
                value={valores.biomecanica}
                onChange={(e) => handleChange('biomecanica', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nutrición, Digestión y Sensibilidades</label>
              <textarea
                rows={2}
                value={valores.gastrointestinal}
                onChange={(e) => handleChange('gastrointestinal', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CON BOTONES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={handleRestablecer}
          icon={<RotateCcw className="w-4 h-4 text-slate-500" />}
          className="text-xs text-slate-600 hover:text-rose-600 w-full sm:w-auto"
        >
          Restablecer originales
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCerrar}
            className="w-full sm:w-auto"
          >
            Cerrar
          </Button>
          <Button
            type="submit"
            icon={<Save className="w-4 h-4" />}
            colorTheme={{
              bgNormal: 'bg-indigo-600',
              bgHover: 'hover:bg-indigo-700',
              textColor: 'text-white',
              focusRing: 'focus:ring-indigo-500',
            }}
            className="w-full sm:w-auto px-6"
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  );
};

