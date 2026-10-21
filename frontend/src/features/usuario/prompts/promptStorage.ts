export interface ValoresBasalesPrompt {
  antecedentesQuirurgicos: string;
  estadoTiroideo: string;
  regulacionGlucosa: string;
  saludReproductiva: string;
  perfilLipidico: string;
  toleranciaOrtostatica: string;
  sueno: string;
  cefaleas: string;
  biomecanica: string;
  gastrointestinal: string;
}

export const VALORES_BASALES_POR_DEFECTO: ValoresBasalesPrompt = {
  antecedentesQuirurgicos:
    'Otoplastia (cicatrización normal, sin queloides). Sin antecedentes de anafilaxia.',
  estadoTiroideo:
    'TSH = 3,09 mUI/L (junio de 2025). Presenta signos clínicos de hipofunción subclínica: afinamiento del tercio externo de las cejas (signo de Hertoghe), estreñimiento ocasional y aumento reciente de la sensibilidad al frío. Antecedentes familiares de hipotiroidismo.',
  regulacionGlucosa:
    'Glucosa en ayunas = 83 mg/dL. Experimenta niebla mental posprandial y bajadas de energía (síntomas de hipoglucemia reactiva) tras comidas ricas en carbohidratos.',
  saludReproductiva:
    'Ciclo regular de 28–29 días. Dismenorrea leve (tratada con Naproxeno). La fase lútea desencadena irritabilidad, tensión mamaria y acné (empeorado por azúcar/chocolate).',
  perfilLipidico:
    '(2025): LDL: 87 | HDL: 52 | TG: 44 (Marcadores excelentes).',
  toleranciaOrtostatica:
    'Visión borrosa y mareos frecuentes al ponerse de pie rápidamente (sugestivos de hipotensión ortostática), exacerbados por una hidratación crónicamente baja (~1 L/día).',
  sueno:
    'Baja latencia de sueño, sueños vívidos/estresantes ocasionales.',
  cefaleas:
    'Estrictamente dependientes del clima (sensibilidad a la presión barométrica).',
  biomecanica:
    'Postura de cabeza adelantada, hombros caídos/redondeados (dolor en la zona de la giba dorsal), dolor lumbar. Acortamiento de tendones de Aquiles/gemelos que afecta la flexibilidad y la cinemática de la sentadilla. Torpeza ocasional en escaleras.',
  gastrointestinal:
    'Dieta de fusión mediterránea-asiática (alta en proteínas, baja en azúcares). Sensibilidades no diagnosticadas: distensión abdominal notable con alimentos que contienen gluten, digestión pesada de cebollas/condimentos.',
};

const STORAGE_KEY = 'medico_prompt_basales_v1';

export const obtenerValoresBasalesStorage = (): ValoresBasalesPrompt => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...VALORES_BASALES_POR_DEFECTO };
    const parsed = JSON.parse(raw) as Partial<ValoresBasalesPrompt>;
    return {
      ...VALORES_BASALES_POR_DEFECTO,
      ...parsed,
    };
  } catch (err) {
    console.error('Error al leer valores basales de localStorage:', err);
    return { ...VALORES_BASALES_POR_DEFECTO };
  }
};

export const guardarValoresBasalesStorage = (valores: ValoresBasalesPrompt): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valores));
  } catch (err) {
    console.error('Error al guardar valores basales en localStorage:', err);
  }
};

export const restablecerValoresBasalesStorage = (): ValoresBasalesPrompt => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error al restablecer valores basales:', err);
  }
  return { ...VALORES_BASALES_POR_DEFECTO };
};

