export type ModuloPromptKey =
  | 'perfil_biometrico'
  | 'composicion_corporal'
  | 'actividad_pasos'
  | 'entrenamiento_biomecanica'
  | 'sueno_circadiano'
  | 'ciclo_menstrual'
  | 'farmacologia_suplementacion'
  | 'toxicos_habitos'
  | 'antecedentes_inmunologicos'
  | 'sintomas';

export interface PromptModularVariables {
  // 1. Rol y directrices clínicas
  rolDirectricesClinicas: string;

  // 2. Motivo (Texto para introducir por el usuario, opcional/no necesario en predictivos)
  motivoConsulta: string;

  // 3. Módulos del 1 al 10
  moduloPerfilBiometrico: string;
  moduloComposicionCorporal: string;
  moduloActividadPasos: string;
  moduloEntrenamientoBiomecanica: string;
  moduloSuenoRitmosCircadianos: string;
  moduloCicloMenstrual: string;
  moduloFarmacologiaSuplementacion: string;
  moduloToxicosHabitos: string;
  moduloAntecedentesInmunologicos: string;
  moduloSintomas: string;

  // 4. Lo que se va a hacer (Dependiendo de para qué sea el uso)
  objetivoInstrucciones: string;
}

// Variables inicializadas completamente vacías para introducir los textos posteriormente
export const PROMPT_MODULAR_VARIABLES_VACIAS: PromptModularVariables = {
  rolDirectricesClinicas: '',
  motivoConsulta: '',
  moduloPerfilBiometrico: '',
  moduloComposicionCorporal: '',
  moduloActividadPasos: '',
  moduloEntrenamientoBiomecanica: '',
  moduloSuenoRitmosCircadianos: '',
  moduloCicloMenstrual: '',
  moduloFarmacologiaSuplementacion: '',
  moduloToxicosHabitos: '',
  moduloAntecedentesInmunologicos: '',
  moduloSintomas: '',
  objetivoInstrucciones: '',
};

export interface ModuloInfoDef {
  key: ModuloPromptKey;
  nombre: string;
  descripcion: string;
  condicionalRegla?: boolean;
}

export const MODULOS_PROMPT_INFO: ModuloInfoDef[] = [
  {
    key: 'perfil_biometrico',
    nombre: 'Perfil Biométrico y Ocupacional',
    descripcion: 'Edad, altura, peso basal, sexo biológico y contexto laboral/cognitivo.',
  },
  {
    key: 'composicion_corporal',
    nombre: 'Composición Corporal y Tendencias Metabólicas',
    descripcion: 'Evolución de peso, grasa corporal, masa magra, cintura y métricas antropométricas.',
  },
  {
    key: 'actividad_pasos',
    nombre: 'Actividad Diaria y Pasos',
    descripcion: 'Volumen de movimiento, pasos diarios y gasto energético.',
  },
  {
    key: 'entrenamiento_biomecanica',
    nombre: 'Entrenamiento y Carga Biomecánica',
    descripcion: 'Sesiones de fuerza/cardio, ejercicios realizados, volumen e intensidad muscular.',
  },
  {
    key: 'sueno_circadiano',
    nombre: 'Sueño y Ritmos Circadianos',
    descripcion: 'Horarios de descanso, latencia, regularidad y calidad del sueño.',
  },
  {
    key: 'ciclo_menstrual',
    nombre: 'Ciclo Menstrual',
    descripcion: 'Fases menstruales, regularidad de ciclos y síntomas asociados.',
    condicionalRegla: true,
  },
  {
    key: 'farmacologia_suplementacion',
    nombre: 'Farmacología y Suplementación',
    descripcion: 'Tratamientos farmacológicos activos, dosis, frecuencias y suplementos.',
  },
  {
    key: 'toxicos_habitos',
    nombre: 'Tóxicos y Hábitos Basales',
    descripcion: 'Consumo de cafeína, alcohol, tabaco u otras sustancias basales.',
  },
  {
    key: 'antecedentes_inmunologicos',
    nombre: 'Antecedentes Clínicos e Inmunológicos (Estático)',
    descripcion: 'Patologías diagnosticadas, alergias conocidas y antecedentes familiares.',
  },
  {
    key: 'sintomas',
    nombre: 'Síntomas Recientes Seleccionados (Triaje Agudo) / Recurrencia Sintomática Histórica (Predictivo - 90 a 180 días)',
    descripcion: 'Ocurrencias sintomáticas agudas o patrones históricos de recurrencia.',
  },
];

export const renderPromptModular = (
  variables: PromptModularVariables,
  modulosActivos: Record<ModuloPromptKey, boolean>
): string => {
  const bloques: string[] = [];

  // 1. Rol y directrices clínicas
  if (variables.rolDirectricesClinicas && variables.rolDirectricesClinicas.trim()) {
    bloques.push(variables.rolDirectricesClinicas.trim());
  }

  // 2. Motivo (Texto introducido por el usuario)
  if (variables.motivoConsulta && variables.motivoConsulta.trim()) {
    bloques.push(`## MOTIVO DE LA CONSULTA\n${variables.motivoConsulta.trim()}`);
  }

  // 3. Módulos
  const seccionesModulos: string[] = [];

  if (modulosActivos.perfil_biometrico) {
    seccionesModulos.push(
      `### 1. PERFIL BIOMÉTRICO Y OCUPACIONAL\n${variables.moduloPerfilBiometrico}`
    );
  }
  if (modulosActivos.composicion_corporal) {
    seccionesModulos.push(
      `### 2. COMPOSICIÓN CORPORAL Y TENDENCIAS METABÓLICAS\n${variables.moduloComposicionCorporal}`
    );
  }
  if (modulosActivos.actividad_pasos) {
    seccionesModulos.push(
      `### 3. ACTIVIDAD DIARIA Y PASOS\n${variables.moduloActividadPasos}`
    );
  }
  if (modulosActivos.entrenamiento_biomecanica) {
    seccionesModulos.push(
      `### 4. ENTRENAMIENTO Y CARGA BIOMECÁNICA\n${variables.moduloEntrenamientoBiomecanica}`
    );
  }
  if (modulosActivos.sueno_circadiano) {
    seccionesModulos.push(
      `### 5. SUEÑO Y RITMOS CIRCADIANOS\n${variables.moduloSuenoRitmosCircadianos}`
    );
  }
  if (modulosActivos.ciclo_menstrual) {
    seccionesModulos.push(
      `### 6. CICLO MENSTRUAL\n${variables.moduloCicloMenstrual}`
    );
  }
  if (modulosActivos.farmacologia_suplementacion) {
    seccionesModulos.push(
      `### 7. FARMACOLOGÍA Y SUPLEMENTACIÓN\n${variables.moduloFarmacologiaSuplementacion}`
    );
  }
  if (modulosActivos.toxicos_habitos) {
    seccionesModulos.push(
      `### 8. TÓXICOS Y HÁBITOS BASALES\n${variables.moduloToxicosHabitos}`
    );
  }
  if (modulosActivos.antecedentes_inmunologicos) {
    seccionesModulos.push(
      `### 9. ANTECEDENTES CLÍNICOS E INMUNOLÓGICOS (ESTÁTICO)\n${variables.moduloAntecedentesInmunologicos}`
    );
  }
  if (modulosActivos.sintomas) {
    seccionesModulos.push(
      `### 10. SÍNTOMAS RECIENTES SELECCIONADOS / RECURRENCIA SINTOMÁTICA HISTÓRICA\n${variables.moduloSintomas}`
    );
  }

  if (seccionesModulos.length > 0) {
    bloques.push(`## MÓDULOS CLÍNICOS INCLUIDOS\n\n${seccionesModulos.join('\n\n')}`);
  }

  // 4. Lo que se va a hacer
  if (variables.objetivoInstrucciones && variables.objetivoInstrucciones.trim()) {
    bloques.push(`## OBJETIVO Y ACCIONES\n${variables.objetivoInstrucciones.trim()}`);
  }

  return bloques.join('\n\n---\n\n');
};

