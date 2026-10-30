import React, { useState } from 'react';
import { UsuarioDatosForm } from '../features/usuario/UsuarioDatosForm';
import { HabitosToxicosTabla } from '../features/usuario/HabitosToxicosTabla';
import { AlergiasTabla } from '../features/usuario/AlergiasTabla';
import { PatologiasTabla } from '../features/usuario/PatologiasTabla';
import { AntecedentesTabla } from '../features/usuario/AntecedentesTabla';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Sparkles, SlidersHorizontal, Filter } from 'lucide-react';
import { PromptConsultaForm } from '../features/usuario/prompts/PromptConsultaForm';
import { VerPromptModal } from '../features/usuario/prompts/VerPromptModal';
import { PromptConfiguracionModal } from '../features/usuario/prompts/PromptConfiguracionModal';
import { PromptFiltrosForm } from '../features/usuario/prompts/PromptFiltrosForm';
import { PromptClinicoGenerator } from '../features/usuario/prompts/PromptClinicoGenerator';
import {
  type ModuloPromptKey,
  type TipoPromptModular,
  type FiltrosModulo7Farmacologia,
  type FiltrosModulo9Antecedentes,
  type FiltrosModulo10Sintomas,
  PROMPT_MODULAR_VARIABLES_VACIAS,
  renderPromptModular,
} from '../features/usuario/prompts/promptModularTemplate';
import {
  compilarVariablesPrompt,
  compilarModulo1Biometrico,
  compilarModulo2ComposicionCorporal,
  compilarModulo3ActividadPasos,
  compilarModulo4Entrenamiento,
  compilarModulo5Sueno,
  compilarModulo6CicloMenstrual,
  compilarModulo7Farmacologia,
  compilarModulo8Habitos,
  compilarModulo9Antecedentes,
  compilarModulo10Sintomas,
} from '../utils/promptCalculations';

export const UsuarioPage: React.FC = () => {
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const [isVerPromptOpen, setIsVerPromptOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGenerando, setIsGenerando] = useState(false);
  const [promptGenerado, setPromptGenerado] = useState('');

  const modalTheme = {
    titleColor: 'text-indigo-900',
    headerBorder: 'border-indigo-100',
    closeIconColor: 'text-slate-400',
    closeIconHover: 'hover:text-indigo-600',
    modalBorder: 'border-indigo-400',
  };

  const handleGenerarPrompt = async (consulta: string) => {
    setIsConsultaModalOpen(false);
    setIsGenerando(true);

    try {
      // 1. Obtener datos reales de la aplicacion y armar las variables
      const variables = await compilarVariablesPrompt(consulta);

      // 2. Instanciar la clase del generador con las variables
      const generator = new PromptClinicoGenerator(variables);
      generator.setEntradaConsulta(consulta);

      // 3. Generar el texto y abrir el modal visor
      const textoFinal = generator.generar();
      setPromptGenerado(textoFinal);
      setIsVerPromptOpen(true);
    } catch (error) {
      console.error('Error al generar el prompt clínico:', error);
    } finally {
      setIsGenerando(false);
    }
  };

  const handleGenerarPromptModular = async (
    tipo: TipoPromptModular,
    motivo: string,
    modulosActivos: Record<ModuloPromptKey, boolean>,
    filtrosModulo7: FiltrosModulo7Farmacologia,
    filtrosModulo9: FiltrosModulo9Antecedentes,
    filtrosModulo10: FiltrosModulo10Sintomas
  ) => {
    setIsFiltrosModalOpen(false);
    setIsGenerando(true);

    try {
      // 1. Compilar los datos dinámicos del Módulo 1 si está activo
      let textoModulo1 = '';
      if (modulosActivos.perfil_biometrico) {
        textoModulo1 = await compilarModulo1Biometrico();
      }

      // 2. Compilar los datos dinámicos del Módulo 2 si está activo
      let textoModulo2 = '';
      if (modulosActivos.composicion_corporal) {
        textoModulo2 = await compilarModulo2ComposicionCorporal();
      }

      // 3. Compilar los datos dinámicos del Módulo 3 si está activo
      let textoModulo3 = '';
      if (modulosActivos.actividad_pasos) {
        textoModulo3 = await compilarModulo3ActividadPasos();
      }

      // 4. Compilar los datos dinámicos del Módulo 4 si está activo
      let textoModulo4 = '';
      if (modulosActivos.entrenamiento_biomecanica) {
        textoModulo4 = await compilarModulo4Entrenamiento();
      }

      // 5. Compilar los datos dinámicos del Módulo 5 si está activo
      let textoModulo5 = '';
      if (modulosActivos.sueno_circadiano) {
        textoModulo5 = await compilarModulo5Sueno();
      }

      // 6. Compilar los datos dinámicos del Módulo 6 si está activo
      let textoModulo6 = '';
      if (modulosActivos.ciclo_menstrual) {
        textoModulo6 = await compilarModulo6CicloMenstrual();
      }

      // 7. Compilar los datos dinámicos del Módulo 7 si está activo
      let textoModulo7 = '';
      if (modulosActivos.farmacologia_suplementacion) {
        textoModulo7 = await compilarModulo7Farmacologia(filtrosModulo7);
      }

      // 8. Compilar los datos dinámicos del Módulo 8 si está activo
      let textoModulo8 = '';
      if (modulosActivos.toxicos_habitos) {
        textoModulo8 = await compilarModulo8Habitos();
      }

      // 9. Compilar los datos dinámicos del Módulo 9 si está activo
      let textoModulo9 = '';
      if (modulosActivos.antecedentes_inmunologicos) {
        textoModulo9 = await compilarModulo9Antecedentes(filtrosModulo9);
      }

      // 10. Compilar los datos dinámicos del Módulo 10 (10A Triaje o 10B Predictivo) si está activo
      let textoModulo10 = '';
      if (modulosActivos.sintomas) {
        textoModulo10 = await compilarModulo10Sintomas(tipo, filtrosModulo10);
      }

      // 11. Ensamblar el prompt modular con la plantilla de variables
      const variables = {
        ...PROMPT_MODULAR_VARIABLES_VACIAS,
        motivoConsulta: motivo,
        moduloPerfilBiometrico: textoModulo1,
        moduloComposicionCorporal: textoModulo2,
        moduloActividadPasos: textoModulo3,
        moduloEntrenamientoBiomecanica: textoModulo4,
        moduloSuenoRitmosCircadianos: textoModulo5,
        moduloCicloMenstrual: textoModulo6,
        moduloFarmacologiaSuplementacion: textoModulo7,
        moduloToxicosHabitos: textoModulo8,
        moduloAntecedentesInmunologicos: textoModulo9,
        moduloSintomas: textoModulo10,
      };

      const textoFinal = renderPromptModular(tipo, variables, modulosActivos);
      setPromptGenerado(textoFinal);
      setIsVerPromptOpen(true);
    } catch (error) {
      console.error('Error al generar el prompt modular con filtros:', error);
    } finally {
      setIsGenerando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center gap-3 border-b-2 border-indigo-200 pb-4">
        <span className="text-4xl">👤</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Perfil de Usuario</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Datos biométricos base, tóxicos y hábitos, alergias, patologías y antecedentes para medicina preventiva
          </p>
        </div>
      </div>

      {/* CONTENEDORES DE INFORMACIÓN */}
      <div className="space-y-8">
        {/* BOTONES DE PROMPT ENCIMA DE USUARIODATOSFORM */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsConfigModalOpen(true)}
            icon={<SlidersHorizontal className="w-4 h-4 text-indigo-600" />}
            className="w-full sm:w-auto font-medium px-4 py-2.5 border-indigo-200 text-indigo-900 hover:bg-indigo-50"
          >
            Modificar datos prompt
          </Button>

          <Button
            type="button"
            onClick={() => setIsConsultaModalOpen(true)}
            icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            colorTheme={{
              bgNormal: 'bg-indigo-50 hover:bg-indigo-100',
              bgHover: 'hover:bg-indigo-100',
              textColor: 'text-indigo-900',
              border: 'border border-indigo-200',
              focusRing: 'focus:ring-indigo-500',
            }}
            className="w-full sm:w-auto font-bold px-5 py-2.5 shadow-xs"
          >
            Consulta rápida
          </Button>

          <Button
            type="button"
            onClick={() => setIsFiltrosModalOpen(true)}
            icon={<Filter className="w-5 h-5" />}
            colorTheme={{
              bgNormal: 'bg-indigo-600',
              bgHover: 'hover:bg-indigo-700',
              textColor: 'text-white',
              focusRing: 'focus:ring-indigo-500',
            }}
            className="w-full sm:w-auto shadow-md hover:shadow-indigo-500/20 font-bold px-6 py-2.5"
          >
            Prompt con filtros
          </Button>
        </div>

        <UsuarioDatosForm />
        <HabitosToxicosTabla />
        <AlergiasTabla />
        <PatologiasTabla />
        <AntecedentesTabla />
      </div>

      {/* MODAL 1: FORMULARIO DE ENTRADA DE LA CONSULTA */}
      <Modal
        isOpen={isConsultaModalOpen}
        onClose={() => setIsConsultaModalOpen(false)}
        title="Crear Prompt Clínico"
        size="lg"
        preventClose={true}
        colorTheme={modalTheme}
      >
        <PromptConsultaForm
          onGenerar={handleGenerarPrompt}
          onCancel={() => setIsConsultaModalOpen(false)}
          isLoading={isGenerando}
        />
      </Modal>

      {/* MODAL 2: VISOR DEL PROMPT GENERADO */}
      <Modal
        isOpen={isVerPromptOpen}
        onClose={() => setIsVerPromptOpen(false)}
        title="Prompt Clínico Generado"
        size="xl"
        preventClose={true}
        colorTheme={modalTheme}
      >
        <VerPromptModal
          textoPrompt={promptGenerado}
          onSalir={() => setIsVerPromptOpen(false)}
        />
      </Modal>

      {/* MODAL 3: CONFIGURACIÓN DE DATOS BASALES DEL PROMPT */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configurar Datos Basales del Prompt"
        size="xl"
        preventClose={true}
        colorTheme={modalTheme}
      >
        <PromptConfiguracionModal
          onCerrar={() => setIsConfigModalOpen(false)}
        />
      </Modal>

      {/* MODAL 4: PROMPT MODULAR CON FILTROS */}
      <Modal
        isOpen={isFiltrosModalOpen}
        onClose={() => setIsFiltrosModalOpen(false)}
        title="Generar Prompt Clínico con Filtros"
        size="xl"
        preventClose={true}
        colorTheme={modalTheme}
      >
        <PromptFiltrosForm
          onGenerar={handleGenerarPromptModular}
          onCancel={() => setIsFiltrosModalOpen(false)}
          isLoading={isGenerando}
        />
      </Modal>

      {/* SPINNER EN TODA LA PANTALLA MIENTRAS SE GENERA EL PROMPT */}
      {isGenerando && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4 border-2 border-indigo-200">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-800">Generando prompt clínico</h4>
              <p className="text-xs text-slate-500">
                Recopilando datos de salud basales y compilando la consulta personalizada...
              </p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};