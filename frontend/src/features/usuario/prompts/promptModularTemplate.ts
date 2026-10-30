export type TipoPromptModular = 'triaje' | 'predictivo';

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

// --- 1. ROL Y DIRECTRICES CLÍNICAS (Variables según tipo de consulta) ---
export const ROL_DIRECTRICES_CLINICAS_TRIAJE = `# ROL Y DIRECTRICES CLÍNICAS
Actúa como médico especialista en Medicina Interna y Soporte Diagnóstico Computacional.
Tu objetivo es evaluar el cuadro agudo del usuario considerando de forma integrada el motivo libre de consulta y la telemetría biométrica seleccionada.`;

export const ROL_DIRECTRICES_CLINICAS_PREDICTIVO = `# ROL Y DIRECTRICES CLÍNICAS
Actúa como médico especialista en Medicina Preventiva, Longevidad y Cronobiología.
Analiza los vectores estadísticos de tendencia, dispersión (medias, mínimos, máximos) y recurrencias para identificar patrones de disfunción subclínica y prevenir patologías futuras.`;

// --- 2. MOTIVO LIBRE INTRODUCIDO POR EL USUARIO (Exclusivo para triaje) ---
export const MOTIVO_LIBRE_USUARIO_TRIAJE = `# MOTIVO LIBRE INTRODUCIDO POR EL USUARIO
"{{MOTIVO_CONSULTA_TEXTO_LIBRE}}"`;

// --- 3. TELEMETRÍA Y CONTEXTO BIOMÉTRICO (Variables según tipo de consulta) ---
export const TELEMETRIA_CONTEXTO_BIOMETRICO_TRIAJE = `# TELEMETRÍA Y CONTEXTO BIOMÉTRICO (MÓDULOS ACTIVADOS)
{{MODULOS_SELECCIONADOS_CONCATENADOS}}`;

export const TELEMETRIA_CONTEXTO_BIOMETRICO_PREDICTIVO = `# TELEMETRÍA LONGITUDINAL Y VECTORES DE DATOS
{{MODULOS_SELECCIONADOS_CONCATENADOS}}`;

// --- 4. SISTEMÁTICA DIAGNÓSTICA EXIGIDA / ANÁLISIS DE RIESGOS (Variables según tipo de consulta) ---
export const SISTEMATICA_DIAGNOSTICA_TRIAJE = `# SISTEMÁTICA DIAGNÓSTICA EXIGIDA
1. **Descarte Inmediato de Banderas Rojas (Red Flags):** Evalúa si la combinación del motivo de consulta y las constantes sugieren riesgo vital inminente, síndrome coronario, focalidad neurológica, infección grave o shock.
2. **Correlación Fisiopatológica Cruzada:**
   - Cruza la clínica con la ergonomía y ocupación laboral.
   - Contrasta los síntomas con la biomecánica deportiva (ACWR y tiempo desde el último estímulo).
   - Analiza interacciones o efectos adversos con fármacos, suplementos o estimulantes.
   - Considera el terreno atópico o alérgico en caso de manifestaciones respiratorias o cutáneas.
3. **Diagnóstico Diferencial Jerarquizado:** Presenta las 3 hipótesis diagnósticas más probables justificadas mediante los datos biométricos.
4. **Preguntas Clave de Triaje:** Plantea hasta 3 preguntas directas para ayudar al paciente a monitorizar su evolución.
5. **Plan de Acción y Criterios de Urgencia:** Medidas de soporte seguras y signos específicos para acudir a evaluación presencial.`;

export const SISTEMATICA_DIAGNOSTICA_PREDICTIVO = `# ANÁLISIS DE RIESGOS PREVENTIVO
1. **Metabolismo y Composición Corporal:** Evalúa la estabilidad ponderal a 90 días, el rango de oscilación, el porcentaje de grasa, el ICE y el ICC para detectar resistencia a la insulina o adiposidad visceral.
2. **Carga Biomecánica y Prevención Lesional:** Cruza el ratio ACWR, la postura descrita en la ocupación y el historial de recurrencia de síntomas (Historial de recurrencia sintomática) para identificar riesgos de tendinopatías o descompensaciones estructurales.
3. **Equilibrio Neurovegetativo y Cronobiología:** Evalúa si la regularidad del sueño, el jetlag social, la deuda acumulada y el consumo de estimulantes amenazan el eje neuroendocrino o la recuperación del sistema inmune.
4. **Semáforo Preventivo:**
   - Verde: Sistemas en homeostasis óptima.
   - Amarillo: Tendencias disfuncionales corregibles a corto plazo.
   - Rojo: Descompensación o riesgo activo que exige intervención clínica.
5. **Intervenciones de Máximo Apalancamiento:** Propón las 3 intervenciones de estilo de vida prioritarias y con mayor impacto biológico medible según los datos analizados.`;

// --- 3. VARIABLES DEDICADAS PARA CADA UNO DE LOS 10 MÓDULOS ---
export const MODULO_1_PERFIL_BIOMETRICO = `### 1. PERFIL BIOMÉTRICO Y OCUPACIONAL
- Sexo: {{USUARIO_SEXO}}
- Edad: {{USUARIO_EDAD_ANOS}} años
- Altura: {{USUARIO_ALTURA_CM}} cm
- IMC actual: {{USUARIO_IMC}} kg/m²
- Ocupación habitual: {{USUARIO_OCUPACION}}`;

export interface Modulo1BiometricoVariables {
  sexo: string;
  edad: number | string;
  alturaCm: number | string;
  imc: number | string;
  ocupacion: string;
}

export const formatearModulo1Biometrico = (
  vars: Modulo1BiometricoVariables
): string => {
  return MODULO_1_PERFIL_BIOMETRICO
    .replace('{{USUARIO_SEXO}}', vars.sexo)
    .replace('{{USUARIO_EDAD_ANOS}}', String(vars.edad))
    .replace('{{USUARIO_ALTURA_CM}}', String(vars.alturaCm))
    .replace('{{USUARIO_IMC}}', String(vars.imc))
    .replace('{{USUARIO_OCUPACION}}', vars.ocupacion);
};

export const MODULO_2_COMPOSICION_CORPORAL = `### 2. COMPOSICIÓN CORPORAL Y METABOLISMO
- Estado actual: {{PESO_ACTUAL_KG}} kg | Grasa: {{GRASA_ACTUAL_PCT}}% (Masa Magra est.: {{MASA_MAGRA_KG}} kg | Grasa est.: {{MASA_GRASA_KG}} kg)
- Dinámica 30 días: Media {{PESO_MEDIA_30D_KG}} kg [Mín: {{PESO_MIN_30D_KG}} kg - Máx: {{PESO_MAX_30D_KG}} kg] (Oscilación total: {{RANGO_OSCILACION_PESO_30D}} kg)
- Variación aguda (últimos 7 días): {{DELTA_PESO_7D_KG}} kg
- Tendencia longitudinal (90 días): {{PENDIENTE_PESO_90D_KG_MES}} kg/mes (Ajuste R²: {{PESO_R2_90D}})
- Medidas corporales: Cintura {{CINTURA_CM}} cm | Cadera {{CADERA_CM}} cm
- Índices de riesgo: ICE {{ICE_VALOR}} (Norma <= 0.50) | ICC {{ICC_VALOR}}`;

export interface Modulo2ComposicionCorporalVariables {
  pesoActualKg: number | string;
  grasaActualPct: number | string;
  masaMagraKg: number | string;
  masaGrasaKg: number | string;
  pesoMedia30dKg: number | string;
  pesoMin30dKg: number | string;
  pesoMax30dKg: number | string;
  rangoOscilacionPeso30d: number | string;
  deltaPeso7dKg: string;
  pendientePeso90dKgMes: string;
  pesoR2_90d: number | string;
  cinturaCm: number | string;
  caderaCm: number | string;
  iceValor: number | string;
  iccValor: number | string;
}

export const formatearModulo2ComposicionCorporal = (
  vars: Modulo2ComposicionCorporalVariables
): string => {
  return MODULO_2_COMPOSICION_CORPORAL
    .replace('{{PESO_ACTUAL_KG}}', String(vars.pesoActualKg))
    .replace('{{GRASA_ACTUAL_PCT}}', String(vars.grasaActualPct))
    .replace('{{MASA_MAGRA_KG}}', String(vars.masaMagraKg))
    .replace('{{MASA_GRASA_KG}}', String(vars.masaGrasaKg))
    .replace('{{PESO_MEDIA_30D_KG}}', String(vars.pesoMedia30dKg))
    .replace('{{PESO_MIN_30D_KG}}', String(vars.pesoMin30dKg))
    .replace('{{PESO_MAX_30D_KG}}', String(vars.pesoMax30dKg))
    .replace('{{RANGO_OSCILACION_PESO_30D}}', String(vars.rangoOscilacionPeso30d))
    .replace('{{DELTA_PESO_7D_KG}}', vars.deltaPeso7dKg)
    .replace('{{PENDIENTE_PESO_90D_KG_MES}}', vars.pendientePeso90dKgMes)
    .replace('{{PESO_R2_90D}}', String(vars.pesoR2_90d))
    .replace('{{CINTURA_CM}}', String(vars.cinturaCm))
    .replace('{{CADERA_CM}}', String(vars.caderaCm))
    .replace('{{ICE_VALOR}}', String(vars.iceValor))
    .replace('{{ICC_VALOR}}', String(vars.iccValor));
};

export const MODULO_3_ACTIVIDAD_PASOS = `### 3. ACTIVIDAD Y DINÁMICA DE MOVIMIENTO
- Pasos diarios (30d): Mediana {{PASOS_MEDIANA_30D}} pasos/día [Mín: {{PASOS_MIN_30D}} - Máx: {{PASOS_MAX_30D}}]
- Ritmo agudo (últimos 7 días): Media {{PASOS_MEDIA_7D}} pasos/día
- Días de inmovilidad/sedentarismo severo (< 5000 pasos en 30d): {{PCT_DIAS_SEDENTARIOS_30D}}%
- Regularidad de movimiento (CV 30d): {{PASOS_CV_30D}}%`;

export interface Modulo3PasosVariables {
  pasosMediana30d: number | string;
  pasosMin30d: number | string;
  pasosMax30d: number | string;
  pasosMedia7d: number | string;
  pctDiasSedentarios30d: number | string;
  pasosCv30d: number | string;
}

export const formatearModulo3Pasos = (
  vars: Modulo3PasosVariables
): string => {
  return MODULO_3_ACTIVIDAD_PASOS
    .replace('{{PASOS_MEDIANA_30D}}', String(vars.pasosMediana30d))
    .replace('{{PASOS_MIN_30D}}', String(vars.pasosMin30d))
    .replace('{{PASOS_MAX_30D}}', String(vars.pasosMax30d))
    .replace('{{PASOS_MEDIA_7D}}', String(vars.pasosMedia7d))
    .replace('{{PCT_DIAS_SEDENTARIOS_30D}}', String(vars.pctDiasSedentarios30d))
    .replace('{{PASOS_CV_30D}}', String(vars.pasosCv30d));
};

export const MODULO_4_ENTRENAMIENTO_BIOMECANICA = `### 4. CARGA BIOMECÁNICA Y ENTRENAMIENTO
- Frecuencia media: {{ENTRENO_FRECUENCIA_SEM}} sesiones/semana
- Volumen muscular agudo (últimos 7 días):
{{RESUMEN_SERIES_GRUPO_7D}}
- Ratio Carga Aguda:Crónica (ACWR 7d/28d): {{ACWR_VALOR}} (Riesgo si > 1.5 o < 0.8)`;

export interface Modulo4EntrenamientoVariables {
  entrenoFrecuenciaSem: number | string;
  resumenSeriesGrupo7d: string;
  acwrValor: number | string;
}

export const formatearModulo4Entrenamiento = (
  vars: Modulo4EntrenamientoVariables
): string => {
  return MODULO_4_ENTRENAMIENTO_BIOMECANICA
    .replace('{{ENTRENO_FRECUENCIA_SEM}}', String(vars.entrenoFrecuenciaSem))
    .replace('{{RESUMEN_SERIES_GRUPO_7D}}', vars.resumenSeriesGrupo7d)
    .replace('{{ACWR_VALOR}}', String(vars.acwrValor));
};

export const MODULO_5_SUENO_RITMOS_CIRCADIANOS = `### 5. SUEÑO Y CRONOBIOLOGÍA
- Sueño habitual (30d): Media {{SUENO_MEDIA_30D}}/noche [Mín: {{SUENO_MIN_30D}} - Máx: {{SUENO_MAX_30D}}]
- Sueño agudo (últimos 7 días): Media {{SUENO_MEDIA_7D}}/noche
- Deuda de sueño acumulada en 14 días: {{DEUDA_SUENO_14D}}
- Regularidad circadiana (Desviación hora de acostarse): +/- {{SUENO_DESVIACION_INICIO}}
- Jetlag social (Fines de semana vs días laborales): {{JETLAG_SOCIAL}}
- Composición media (30d): Profundo {{PCT_SUENO_PROFUNDO_30D}}% | REM {{PCT_SUENO_REM_30D}}%`;

export interface Modulo5SuenoVariables {
  suenoMedia30d: string;
  suenoMin30d: string;
  suenoMax30d: string;
  suenoMedia7d: string;
  deudaSueno14d: string;
  suenoDesviacionInicio: string;
  jetlagSocial: string;
  pctSuenoProfundo30d: number | string;
  pctSuenoRem30d: number | string;
}

export const formatearModulo5Sueno = (
  vars: Modulo5SuenoVariables
): string => {
  return MODULO_5_SUENO_RITMOS_CIRCADIANOS
    .replace('{{SUENO_MEDIA_30D}}', vars.suenoMedia30d)
    .replace('{{SUENO_MIN_30D}}', vars.suenoMin30d)
    .replace('{{SUENO_MAX_30D}}', vars.suenoMax30d)
    .replace('{{SUENO_MEDIA_7D}}', vars.suenoMedia7d)
    .replace('{{DEUDA_SUENO_14D}}', vars.deudaSueno14d)
    .replace('{{SUENO_DESVIACION_INICIO}}', vars.suenoDesviacionInicio)
    .replace('{{JETLAG_SOCIAL}}', vars.jetlagSocial)
    .replace('{{PCT_SUENO_PROFUNDO_30D}}', String(vars.pctSuenoProfundo30d))
    .replace('{{PCT_SUENO_REM_30D}}', String(vars.pctSuenoRem30d));
};

export const MODULO_6_CICLO_MENSTRUAL = `### 6. CICLO MENSTRUAL Y ESTADO HORMONAL
- Momento del ciclo: Día {{CICLO_DIA_ACTUAL}} (Fase estimada: {{CICLO_FASE_ACTUAL}})
- Duración media (3-6 ciclos previos): {{CICLO_DURACION_MEDIA_DIAS}} +/- {{CICLO_DESVIACION_DIAS}} días
- Regularidad: {{CICLO_REGULARIDAD_ESTADO}}`;

export interface Modulo6CicloVariables {
  cicloDiaActual: number | string;
  cicloFaseActual: string;
  cicloDuracionMediaDias: number | string;
  cicloDesviacionDias: number | string;
  cicloRegularidadEstado: string;
}

export const formatearModulo6Ciclo = (
  vars: Modulo6CicloVariables
): string => {
  return MODULO_6_CICLO_MENSTRUAL
    .replace('{{CICLO_DIA_ACTUAL}}', String(vars.cicloDiaActual))
    .replace('{{CICLO_FASE_ACTUAL}}', vars.cicloFaseActual)
    .replace('{{CICLO_DURACION_MEDIA_DIAS}}', String(vars.cicloDuracionMediaDias))
    .replace('{{CICLO_DESVIACION_DIAS}}', String(vars.cicloDesviacionDias))
    .replace('{{CICLO_REGULARIDAD_ESTADO}}', vars.cicloRegularidadEstado);
};

export const MODULO_7_FARMACOLOGIA_SUPLEMENTACION = `### 7. FARMACOLOGÍA Y SUPLEMENTACIÓN ACTIVA
- Medicación activa:
{{LISTADO_FARMACOS_ACTIVOS}}
- Suplementación nutricional:
{{LISTADO_SUPLEMENTOS_ACTIVOS}}
- Tomas puntuales / rescate recientes (últimos 14 días):
{{LISTADO_TOMAS_PUNTUALES_14D}}
- Variaciones farmacológicas (últimos 30 días): {{CAMBIOS_FARMACOLOGICOS_RECIENTES}}`;

export interface FiltrosModulo7Farmacologia {
  incluirFarmacosActivos: boolean;
  farmacosActivosIds: string[];
  incluirSuplementosActivos: boolean;
  suplementosActivosIds: string[];
  incluirTomasPuntuales: boolean;
  tomasPuntualesMedicamentoIds: string[];
}

export interface Modulo7FarmacologiaVariables {
  listadoFarmacosActivos: string;
  listadoSuplementosActivos: string;
  listadoTomasPuntuales14d: string;
  cambiosFarmacologicosRecientes: string;
}

export const formatearModulo7Farmacologia = (
  vars: Modulo7FarmacologiaVariables
): string => {
  const lineas: string[] = ['### 7. FARMACOLOGÍA Y SUPLEMENTACIÓN ACTIVA'];

  if (vars.listadoFarmacosActivos.trim()) {
    lineas.push(`- Medicación activa:\n${vars.listadoFarmacosActivos}`);
  }

  if (vars.listadoSuplementosActivos.trim()) {
    lineas.push(`- Suplementación nutricional:\n${vars.listadoSuplementosActivos}`);
  }

  if (vars.listadoTomasPuntuales14d.trim()) {
    lineas.push(
      `- Tomas puntuales / rescate recientes (últimos 14 días):\n${vars.listadoTomasPuntuales14d}`
    );
  }

  if (vars.cambiosFarmacologicosRecientes.trim()) {
    lineas.push(
      `- Variaciones farmacológicas (últimos 30 días): ${vars.cambiosFarmacologicosRecientes}`
    );
  }

  return lineas.join('\n');
};

export const MODULO_8_TOXICOS_HABITOS = `### 8. TÓXICOS Y HÁBITOS BASALES
- Consumos activos y pautas:
{{HABITOS_TOXICOS_ACTIVOS}}
- Sustancias descartadas (No consume): {{HABITOS_TOXICOS_NEGATIVOS}}
- Carga de estimulantes estimada: {{CARGA_ESTIMULANTES_DIARIA}}`;

export interface Modulo8HabitosVariables {
  habitosToxicosActivos: string;
  habitosToxicosNegativos: string;
  cargaEstimulantesDiaria: string;
}

export const formatearModulo8Habitos = (
  vars: Modulo8HabitosVariables
): string => {
  const lineas: string[] = ['### 8. TÓXICOS Y HÁBITOS BASALES'];

  if (vars.habitosToxicosActivos.trim()) {
    lineas.push(`- Consumos activos y pautas:\n${vars.habitosToxicosActivos}`);
  }

  if (vars.habitosToxicosNegativos.trim()) {
    lineas.push(`- Sustancias descartadas (No consume): ${vars.habitosToxicosNegativos}`);
  }

  lineas.push(`- Carga de estimulantes estimada: ${vars.cargaEstimulantesDiaria}`);

  return lineas.join('\n');
};

export const MODULO_9_ANTECEDENTES_CLINICOS_INMUNOLOGICOS = `### 9. ANTECEDENTES PATOLÓGICOS E INMUNOLÓGICOS
- Terreno alérgico e intolerancias:
{{ANTECEDENTES_ALERGIAS_LISTADO}}
- Patologías crónicas diagnosticadas: {{ANTECEDENTES_PATOLOGIAS_LISTADO}}
- Antecedentes familiares directos: {{ANTECEDENTES_FAMILIARES_LISTADO}}`;

export interface FiltrosModulo9Antecedentes {
  antecedentesIds: string[];
}

export interface Modulo9AntecedentesVariables {
  antecedentesAlergiasListado: string;
  antecedentesPatologiasListado: string;
  antecedentesFamiliaresListado: string;
}

export const formatearModulo9Antecedentes = (
  vars: Modulo9AntecedentesVariables
): string => {
  const lineas: string[] = ['### 9. ANTECEDENTES PATOLÓGICOS E INMUNOLÓGICOS'];

  if (vars.antecedentesAlergiasListado.trim()) {
    lineas.push(`- Terreno alérgico e intolerancias:\n${vars.antecedentesAlergiasListado}`);
  }

  if (vars.antecedentesPatologiasListado.trim()) {
    lineas.push(`- Patologías crónicas diagnosticadas: ${vars.antecedentesPatologiasListado}`);
  }

  if (vars.antecedentesFamiliaresListado.trim()) {
    lineas.push(`- Antecedentes familiares directos: ${vars.antecedentesFamiliaresListado}`);
  }

  return lineas.join('\n');
};

export const MODULO_10A_SINTOMAS_TRIAJE = `### 10A. SÍNTOMAS RECIENTES VINCULADOS A LA CONSULTA
{{SINTOMAS_SELECCIONADOS_LISTADO}}`;

export const MODULO_10B_SINTOMAS_PREDICTIVO = `### 10B. HISTORIAL DE RECURRENCIA SINTOMÁTICA (90-180 DÍAS)
- Focos corporales repetitivos y cronología:
{{MATRIZ_RECURRENCIA_SINTOMAS_90_180D}}`;

export const MODULO_10_SINTOMAS = MODULO_10A_SINTOMAS_TRIAJE;

export type VentanaDiasTriajeSintomas = 7 | 14 | 30;
export type VentanaDiasPredictivoSintomas = 90 | 120 | 180;
export type MinRepeticionesPredictivoSintomas = 1 | 2;

export interface FiltrosModulo10Sintomas {
  // Modo Triaje (10A)
  ventanaDiasTriaje: VentanaDiasTriajeSintomas;
  sintomasSeleccionadosIds: string[];
  // Modo Predictivo (10B)
  ventanaDiasPredictivo: VentanaDiasPredictivoSintomas;
  minRepeticionesPredictivo: MinRepeticionesPredictivoSintomas;
  focosSeleccionadosClaves: string[];
}

export interface Modulo10ASintomasTriajeVariables {
  sintomasSeleccionadosListado: string;
}

export const formatearModulo10ASintomasTriaje = (
  vars: Modulo10ASintomasTriajeVariables
): string => {
  return MODULO_10A_SINTOMAS_TRIAJE.replace(
    '{{SINTOMAS_SELECCIONADOS_LISTADO}}',
    vars.sintomasSeleccionadosListado
  );
};

export interface Modulo10BSintomasPredictivoVariables {
  matrizRecurrenciaSintomas90_180d: string;
}

export const formatearModulo10BSintomasPredictivo = (
  vars: Modulo10BSintomasPredictivoVariables
): string => {
  return MODULO_10B_SINTOMAS_PREDICTIVO.replace(
    '{{MATRIZ_RECURRENCIA_SINTOMAS_90_180D}}',
    vars.matrizRecurrenciaSintomas90_180d
  );
};

export interface PromptModularVariables {
  // 1. Rol y directrices clínicas
  rolDirectricesClinicasTriaje: string;
  rolDirectricesClinicasPredictivo: string;

  // 2. Motivo libre de consulta (exclusivo para triaje)
  motivoLibreUsuarioTriaje: string;
  motivoConsulta: string;

  // 3. Telemetría y contexto biométrico (encabezado + contenedor de módulos)
  telemetriaContextoBiometricoTriaje: string;
  telemetriaContextoBiometricoPredictivo: string;

  // Módulos del 1 al 10
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

  // 4. Sistemática diagnóstica exigida / análisis preventivo
  sistematicaDiagnosticaTriaje: string;
  sistematicaDiagnosticaPredictivo: string;
}

// Variables inicializadas por defecto enlazadas a sus constantes
export const PROMPT_MODULAR_VARIABLES_VACIAS: PromptModularVariables = {
  rolDirectricesClinicasTriaje: ROL_DIRECTRICES_CLINICAS_TRIAJE,
  rolDirectricesClinicasPredictivo: ROL_DIRECTRICES_CLINICAS_PREDICTIVO,
  motivoLibreUsuarioTriaje: MOTIVO_LIBRE_USUARIO_TRIAJE,
  motivoConsulta: '',
  telemetriaContextoBiometricoTriaje: TELEMETRIA_CONTEXTO_BIOMETRICO_TRIAJE,
  telemetriaContextoBiometricoPredictivo: TELEMETRIA_CONTEXTO_BIOMETRICO_PREDICTIVO,
  moduloPerfilBiometrico: MODULO_1_PERFIL_BIOMETRICO,
  moduloComposicionCorporal: MODULO_2_COMPOSICION_CORPORAL,
  moduloActividadPasos: MODULO_3_ACTIVIDAD_PASOS,
  moduloEntrenamientoBiomecanica: MODULO_4_ENTRENAMIENTO_BIOMECANICA,
  moduloSuenoRitmosCircadianos: MODULO_5_SUENO_RITMOS_CIRCADIANOS,
  moduloCicloMenstrual: MODULO_6_CICLO_MENSTRUAL,
  moduloFarmacologiaSuplementacion: MODULO_7_FARMACOLOGIA_SUPLEMENTACION,
  moduloToxicosHabitos: MODULO_8_TOXICOS_HABITOS,
  moduloAntecedentesInmunologicos: MODULO_9_ANTECEDENTES_CLINICOS_INMUNOLOGICOS,
  moduloSintomas: MODULO_10_SINTOMAS,
  sistematicaDiagnosticaTriaje: SISTEMATICA_DIAGNOSTICA_TRIAJE,
  sistematicaDiagnosticaPredictivo: SISTEMATICA_DIAGNOSTICA_PREDICTIVO,
};

export interface ModuloInfoDef {
  key: ModuloPromptKey;
  nombre: string;
  descripcion: string;
  condicionalRegla?: boolean;
  tieneFiltros?: boolean;
}

export const MODULOS_PROMPT_INFO: ModuloInfoDef[] = [
  {
    key: 'perfil_biometrico',
    nombre: 'Perfil Biométrico y Ocupacional',
    descripcion: 'Edad, altura, peso basal, sexo biológico y contexto laboral/cognitivo.',
    tieneFiltros: false,
  },
  {
    key: 'composicion_corporal',
    nombre: 'Composición Corporal y Tendencias Metabólicas',
    descripcion: 'Evolución de peso, grasa corporal, masa magra, cintura y métricas antropométricas.',
    tieneFiltros: false,
  },
  {
    key: 'actividad_pasos',
    nombre: 'Actividad Diaria y Pasos',
    descripcion: 'Volumen de movimiento, pasos diarios y gasto energético.',
    tieneFiltros: false,
  },
  {
    key: 'entrenamiento_biomecanica',
    nombre: 'Entrenamiento y Carga Biomecánica',
    descripcion: 'Sesiones de fuerza/cardio, ejercicios realizados, volumen e intensidad muscular.',
    tieneFiltros: false,
  },
  {
    key: 'sueno_circadiano',
    nombre: 'Sueño y Ritmos Circadianos',
    descripcion: 'Horarios de descanso, latencia, regularidad y calidad del sueño.',
    tieneFiltros: false,
  },
  {
    key: 'ciclo_menstrual',
    nombre: 'Ciclo Menstrual',
    descripcion: 'Fases menstruales, regularidad de ciclos y síntomas asociados.',
    condicionalRegla: true,
    tieneFiltros: false,
  },
  {
    key: 'farmacologia_suplementacion',
    nombre: 'Farmacología y Suplementación',
    descripcion: 'Tratamientos farmacológicos activos, dosis, frecuencias y suplementos.',
    tieneFiltros: true,
  },
  {
    key: 'toxicos_habitos',
    nombre: 'Tóxicos y Hábitos Basales',
    descripcion: 'Consumo de cafeína, alcohol, tabaco u otras sustancias basales.',
    tieneFiltros: false,
  },
  {
    key: 'antecedentes_inmunologicos',
    nombre: 'Antecedentes Clínicos e Inmunológicos (Estático)',
    descripcion: 'Patologías diagnosticadas, alergias conocidas y antecedentes familiares.',
    tieneFiltros: true,
  },
  {
    key: 'sintomas',
    nombre: 'Síntomas Recientes Seleccionados (Triaje Agudo) / Recurrencia Sintomática Histórica (Predictivo - 90 a 180 días)',
    descripcion: 'Ocurrencias sintomáticas agudas o patrones históricos de recurrencia.',
    tieneFiltros: true,
  },
];

const renumerarEncabezadoModulo = (texto: string, numeroOrden: number): string => {
  return texto.trim().replace(/^###\s+\d+[AB]?\./, `### ${numeroOrden}.`);
};

export const renderPromptModular = (
  tipo: TipoPromptModular,
  variables: PromptModularVariables,
  modulosActivos: Record<ModuloPromptKey, boolean>
): string => {
  const bloques: string[] = [];

  // 1. ROL Y DIRECTRICES CLÍNICAS (según triaje o predictivo)
  const rol =
    tipo === 'triaje'
      ? variables.rolDirectricesClinicasTriaje
      : variables.rolDirectricesClinicasPredictivo;

  if (rol && rol.trim()) {
    bloques.push(rol.trim());
  }

  // 2. MOTIVO LIBRE INTRODUCIDO POR EL USUARIO (exclusivo para triaje)
  if (tipo === 'triaje') {
    const textoMotivo =
      variables.motivoConsulta && variables.motivoConsulta.trim()
        ? variables.motivoConsulta.trim()
        : 'Sin motivo adicional en texto libre.';
    const bloqueMotivo = variables.motivoLibreUsuarioTriaje.replace(
      '{{MOTIVO_CONSULTA_TEXTO_LIBRE}}',
      textoMotivo
    );
    bloques.push(bloqueMotivo.trim());
  }

  // 3. TELEMETRÍA Y CONTEXTO BIOMÉTRICO (Módulos seleccionados y numerados secuencialmente)
  const modulosSeleccionados: string[] = [];
  let contadorModulo = 1;
  const pushModuloNumerado = (contenido: string) => {
    modulosSeleccionados.push(renumerarEncabezadoModulo(contenido, contadorModulo));
    contadorModulo += 1;
  };

  if (modulosActivos.perfil_biometrico && variables.moduloPerfilBiometrico.trim()) {
    pushModuloNumerado(variables.moduloPerfilBiometrico);
  }
  if (modulosActivos.composicion_corporal && variables.moduloComposicionCorporal.trim()) {
    pushModuloNumerado(variables.moduloComposicionCorporal);
  }
  if (modulosActivos.actividad_pasos && variables.moduloActividadPasos.trim()) {
    pushModuloNumerado(variables.moduloActividadPasos);
  }
  if (modulosActivos.entrenamiento_biomecanica && variables.moduloEntrenamientoBiomecanica.trim()) {
    pushModuloNumerado(variables.moduloEntrenamientoBiomecanica);
  }
  if (modulosActivos.sueno_circadiano && variables.moduloSuenoRitmosCircadianos.trim()) {
    pushModuloNumerado(variables.moduloSuenoRitmosCircadianos);
  }
  if (modulosActivos.ciclo_menstrual && variables.moduloCicloMenstrual.trim()) {
    pushModuloNumerado(variables.moduloCicloMenstrual);
  }
  if (modulosActivos.farmacologia_suplementacion && variables.moduloFarmacologiaSuplementacion.trim()) {
    pushModuloNumerado(variables.moduloFarmacologiaSuplementacion);
  }
  if (modulosActivos.toxicos_habitos && variables.moduloToxicosHabitos.trim()) {
    pushModuloNumerado(variables.moduloToxicosHabitos);
  }
  if (modulosActivos.antecedentes_inmunologicos && variables.moduloAntecedentesInmunologicos.trim()) {
    pushModuloNumerado(variables.moduloAntecedentesInmunologicos);
  }
  if (modulosActivos.sintomas && variables.moduloSintomas.trim()) {
    pushModuloNumerado(variables.moduloSintomas);
  }

  if (modulosSeleccionados.length > 0) {
    const plantillaTelemetria =
      tipo === 'triaje'
        ? variables.telemetriaContextoBiometricoTriaje
        : variables.telemetriaContextoBiometricoPredictivo;
    const bloqueTelemetria = plantillaTelemetria.replace(
      '{{MODULOS_SELECCIONADOS_CONCATENADOS}}',
      modulosSeleccionados.join('\n\n')
    );
    bloques.push(bloqueTelemetria.trim());
  }

  // 4. SISTEMÁTICA DIAGNÓSTICA EXIGIDA / ANÁLISIS DE RIESGOS PREVENTIVO
  const sistematica =
    tipo === 'triaje'
      ? variables.sistematicaDiagnosticaTriaje
      : variables.sistematicaDiagnosticaPredictivo;

  if (sistematica && sistematica.trim()) {
    bloques.push(sistematica.trim());
  }

  return bloques.join('\n\n');
};
