import { apiClient, apiFetch } from '../api/client';
import { calcularIMC, obtenerColorIMC, type PesoDB } from './pesoCalculations';
import { type PromptVariables, type AntecedentesFamiliaresVariables } from '../features/usuario/prompts/promptTemplate';
import { obtenerValoresBasalesStorage } from '../features/usuario/prompts/promptStorage';

export interface AlergiaItem {
  id: string;
  sustancia: string;
  tipo: 'alergia' | 'intolerancia';
  categoria: string;
  reaccion: string;
  gravedad: string;
  fecha_diagnostico?: string | null;
  notas?: string | null;
}

export interface PatologiaItem {
  id: string;
  nombre: string;
  categoria: string;
  estado: string;
  fecha_diagnostico?: string | null;
  tratamiento_actual?: string | null;
  notas?: string | null;
}

export interface AntecedenteItem {
  id: string;
  enfermedad: string;
  parentesco: string;
  edad_diagnostico: number | null;
  fallecido: boolean;
  edad_fallecimiento: number | null;
  detalles: string | null;
}

export interface MedicacionActivaItem {
  id: string;
  medicamento_nombre: string;
  formato: string;
  unidad_dosis: string;
  frecuencia: string;
  cantidad: number;
  activo: boolean;
}

export interface UsuarioInfo {
  altura: string;
  sexo: string;
  nacimiento: string;
  ocupacion: string;
}

/**
 * Calcula la edad exacta en anos cumplidos a partir de una fecha YYYY-MM-DD
 */
export const calcularEdad = (fechaNacimiento: string): number | null => {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();

  if (
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }

  return edad >= 0 ? edad : null;
};

/**
 * Clasifica y formatea los antecedentes familiares segun sus grupos medicos
 */
export const clasificarAntecedentes = (
  antecedentes: AntecedenteItem[]
): AntecedentesFamiliaresVariables => {
  if (!antecedentes || antecedentes.length === 0) {
    return {
      cardiovascular: 'Angina de pecho, stents, ictus y diabetes.',
      endocrino: 'Hipotiroidismo (tratado con yodo radiactivo), SOP.',
      neurologico: 'Trastorno bipolar, demencia post-ictus hemorrágico.',
      otros: 'Asma, anemia.',
    };
  }

  const cardiovascularList: string[] = [];
  const endocrinoList: string[] = [];
  const neurologicoList: string[] = [];
  const otrosList: string[] = [];

  for (const item of antecedentes) {
    const texto = `${item.enfermedad} (${item.parentesco.replace(/_/g, ' ')})`;
    const enfLower = item.enfermedad.toLowerCase();

    if (
      enfLower.includes('cardio') ||
      enfLower.includes('infarto') ||
      enfLower.includes('angina') ||
      enfLower.includes('stent') ||
      enfLower.includes('ictus') ||
      enfLower.includes('corazon') ||
      enfLower.includes('hipertension') ||
      enfLower.includes('arterial') ||
      enfLower.includes('diabetes')
    ) {
      cardiovascularList.push(texto);
    } else if (
      enfLower.includes('tiroides') ||
      enfLower.includes('tiroid') ||
      enfLower.includes('sop') ||
      enfLower.includes('endocrin') ||
      enfLower.includes('metabol')
    ) {
      endocrinoList.push(texto);
    } else if (
      enfLower.includes('neuro') ||
      enfLower.includes('demencia') ||
      enfLower.includes('alzheimer') ||
      enfLower.includes('parkinson') ||
      enfLower.includes('bipolar') ||
      enfLower.includes('esclerosis')
    ) {
      neurologicoList.push(texto);
    } else {
      otrosList.push(texto);
    }
  }

  return {
    cardiovascular:
      cardiovascularList.length > 0
        ? cardiovascularList.join(', ')
        : 'Sin antecedentes cardiovasculares registrados.',
    endocrino:
      endocrinoList.length > 0
        ? endocrinoList.join(', ')
        : 'Sin antecedentes endocrinos registrados.',
    neurologico:
      neurologicoList.length > 0
        ? neurologicoList.join(', ')
        : 'Sin antecedentes neurológicos registrados.',
    otros:
      otrosList.length > 0
        ? otrosList.join(', ')
        : 'Sin otros antecedentes registrados.',
  };
};

/**
 * Consulta la API y compila todas las variables dinámicas disponibles para el prompt
 */
export const compilarVariablesPrompt = async (
  entradaConsulta: string
): Promise<PromptVariables> => {
  const basales = obtenerValoresBasalesStorage();

  // 1. Valores base predeterminados (para todo lo que aun no existe en BBDD)
  const variables: PromptVariables = {
    edad: 22,
    alturaCm: 164,
    pesoKg: 52,
    grasaCorporal: '~20%',
    imc: 19.3,
    imcCategoria: 'Normal',
    ocupacion: 'Estudiante de Ingeniería Biomédica (Alta carga cognitiva, estilo de vida sedentario)',

    condicionesCronicas:
      'Asma extrínseca (desencadenante alérgico), Rinitis alérgica, Dermatitis atópica.',
    alergenosDesencadenantes:
      'Polen, pelo de animales, polvo, ambientes polvorientos, estrés, sudor y luz solar directa.',
    medicacionActual:
      'Biresp (diario), Montelukast (diario/estacional), Terbasmin (rescate), Loratadina (antihistamínico), Adventan (corticoide tópico para brotes).',
    alergiasMedicamentos: 'No conocidas.',
    antecedentesQuirurgicos: basales.antecedentesQuirurgicos,

    estadoTiroideo: basales.estadoTiroideo,
    regulacionGlucosa: basales.regulacionGlucosa,
    saludReproductiva: basales.saludReproductiva,

    perfilLipidico: basales.perfilLipidico,
    toleranciaOrtostatica: basales.toleranciaOrtostatica,

    sueno: basales.sueno,
    cefaleas: basales.cefaleas,

    biomecanica: basales.biomecanica,
    gastrointestinal: basales.gastrointestinal,

    antecedentesFamiliares: {
      cardiovascular: 'Angina de pecho, stents, ictus y diabetes.',
      endocrino: 'Hipotiroidismo (tratado con yodo radiactivo), SOP.',
      neurologico: 'Trastorno bipolar, demencia post-ictus hemorrágico.',
      otros: 'Asma, anemia.',
    },

    entradaConsulta:
      entradaConsulta.trim() ||
      'Quiero evaluar mi estado de salud general, áreas en las que centrarme, aspectos a medir, cambios a realizar y de qué tengo mayor riesgo (y, por supuesto, qué hacer para prevenirlo).',

    listaMedicamentosParaInteracciones: 'Biresp, Montelukast, Loratadina o Naproxeno',
  };

  // 2. Consultas concurrentes a los endpoints de la aplicacion
  try {
    const [
      resUsuario,
      resPesos,
      resPatologias,
      resAlergias,
      resMedicaciones,
      resAntecedentes,
    ] = await Promise.allSettled([
      apiFetch('/api/usuario').then((r) => r.json() as Promise<UsuarioInfo>),
      apiFetch('/api/pesos').then((r) => r.json() as Promise<PesoDB[]>),
      apiClient.get<PatologiaItem[]>('/patologias').then((r) => r.data),
      apiClient.get<AlergiaItem[]>('/alergias').then((r) => r.data),
      apiFetch('/api/medicaciones-activas').then((r) => r.json() as Promise<MedicacionActivaItem[]>),
      apiClient.get<AntecedenteItem[]>('/antecedentes').then((r) => r.data),
    ]);

    // Procesar Datos Usuario
    let alturaCmNum: number | null = null;
    if (resUsuario.status === 'fulfilled' && resUsuario.value) {
      const u = resUsuario.value;
      if (u.ocupacion) {
        variables.ocupacion = u.ocupacion;
      }
      if (u.nacimiento) {
        const edadCalc = calcularEdad(u.nacimiento);
        if (edadCalc !== null) variables.edad = edadCalc;
      }
      if (u.altura) {
        const alt = parseFloat(u.altura);
        if (!isNaN(alt) && alt > 0) {
          variables.alturaCm = alt;
          alturaCmNum = alt;
        }
      }
    }

    // Procesar Pesos y Medidas
    if (resPesos.status === 'fulfilled' && Array.isArray(resPesos.value) && resPesos.value.length > 0) {
      // Ordenar por fecha descendente para obtener el ultimo
      const pesosOrdenados = [...resPesos.value].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      const ultimoPeso = pesosOrdenados[0];
      if (ultimoPeso && ultimoPeso.peso > 0) {
        variables.pesoKg = ultimoPeso.peso;
        if (ultimoPeso.grasa_corporal !== null && ultimoPeso.grasa_corporal !== undefined) {
          variables.grasaCorporal = `~${ultimoPeso.grasa_corporal}%`;
        }
        if (alturaCmNum && alturaCmNum > 0) {
          const imc = calcularIMC(ultimoPeso.peso, alturaCmNum);
          variables.imc = imc;
          variables.imcCategoria = obtenerColorIMC(imc).texto;
        }
      }
    }

    // Procesar Patologias
    if (resPatologias.status === 'fulfilled' && Array.isArray(resPatologias.value) && resPatologias.value.length > 0) {
      const nombresPatologias = resPatologias.value.map((p) => {
        return p.notas ? `${p.nombre} (${p.notas})` : p.nombre;
      });
      variables.condicionesCronicas = nombresPatologias.join(', ');
    }

    // Procesar Alergias
    if (resAlergias.status === 'fulfilled' && Array.isArray(resAlergias.value) && resAlergias.value.length > 0) {
      const desencadenantes: string[] = [];
      const medicamentosAlergicos: string[] = [];

      for (const al of resAlergias.value) {
        if (al.categoria === 'medicamento') {
          medicamentosAlergicos.push(`${al.sustancia} (${al.reaccion})`);
        } else {
          desencadenantes.push(al.sustancia);
        }
      }

      if (desencadenantes.length > 0) {
        variables.alergenosDesencadenantes = desencadenantes.join(', ');
      }
      if (medicamentosAlergicos.length > 0) {
        variables.alergiasMedicamentos = medicamentosAlergicos.join(', ');
      }
    }

    // Procesar Medicaciones Activas
    if (resMedicaciones.status === 'fulfilled' && Array.isArray(resMedicaciones.value) && resMedicaciones.value.length > 0) {
      const activas = resMedicaciones.value.filter((m) => m.activo);
      if (activas.length > 0) {
        const descripciones = activas.map(
          (m) => `${m.medicamento_nombre} (${m.frecuencia.toLowerCase()})`
        );
        variables.medicacionActual = descripciones.join(', ');

        const nombresFarma = activas.map((m) => m.medicamento_nombre);
        variables.listaMedicamentosParaInteracciones = nombresFarma.join(', ');
      }
    }

    // Procesar Antecedentes Familiares
    if (resAntecedentes.status === 'fulfilled' && Array.isArray(resAntecedentes.value) && resAntecedentes.value.length > 0) {
      variables.antecedentesFamiliares = clasificarAntecedentes(resAntecedentes.value);
    }
  } catch (error) {
    console.error('Error al compilar variables del prompt desde la API:', error);
  }

  return variables;
};

// ============================================================================
// EXPORTACIÓN DE MÓDULOS DEL PROMPT MODULAR
// (Lógica modularizada dentro de src/utils/prompts/)
// ============================================================================
export { compilarModulo1Biometrico } from './prompts/modulo1BiometricoCalculations';
export { compilarModulo2ComposicionCorporal } from './prompts/modulo2ComposicionCalculations';
export { compilarModulo3ActividadPasos } from './prompts/modulo3PasosCalculations';
export { compilarModulo4Entrenamiento } from './prompts/modulo4EntrenamientoCalculations';
export { compilarModulo5Sueno } from './prompts/modulo5SuenoCalculations';
export { compilarModulo6CicloMenstrual } from './prompts/modulo6CicloMenstrualCalculations';
export { compilarModulo7Farmacologia } from './prompts/modulo7FarmacologiaCalculations';
export { compilarModulo8Habitos } from './prompts/modulo8HabitosCalculations';
export { compilarModulo9Antecedentes } from './prompts/modulo9AntecedentesCalculations';
export { compilarModulo10Sintomas } from './prompts/modulo10SintomasCalculations';

