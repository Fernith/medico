import {
  type PromptVariables,
  type AntecedentesFamiliaresVariables,
  renderPromptClinico,
} from './promptTemplate';
import { obtenerValoresBasalesStorage } from './promptStorage';

export class PromptClinicoGenerator {
  private variables: PromptVariables;

  constructor(initialVariables?: Partial<PromptVariables>) {
    const basales = obtenerValoresBasalesStorage();

    // Valores por defecto (segun la plantilla base para campos no existentes en BBDD o cuando no haya registros)
    const defaults: PromptVariables = {
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
        'Quiero evaluar mi estado de salud general, áreas en las que centrarme, aspectos a medir, cambios a realizar y de qué tengo mayor riesgo (y, por supuesto, qué hacer para prevenirlo).',

      listaMedicamentosParaInteracciones:
        'Biresp, Montelukast, Loratadina o Naproxeno',
    };

    this.variables = {
      ...defaults,
      ...initialVariables,
      antecedentesFamiliares: {
        ...defaults.antecedentesFamiliares,
        ...(initialVariables?.antecedentesFamiliares || {}),
      },
    };
  }

  public setEntradaConsulta(texto: string): void {
    this.variables.entradaConsulta = texto.trim();
  }

  public setBiometria(biometria: {
    edad?: number | string;
    alturaCm?: number | string;
    pesoKg?: number | string;
    grasaCorporal?: string;
    imc?: number | string;
    imcCategoria?: string;
  }): void {
    if (biometria.edad !== undefined) this.variables.edad = biometria.edad;
    if (biometria.alturaCm !== undefined) this.variables.alturaCm = biometria.alturaCm;
    if (biometria.pesoKg !== undefined) this.variables.pesoKg = biometria.pesoKg;
    if (biometria.grasaCorporal !== undefined) this.variables.grasaCorporal = biometria.grasaCorporal;
    if (biometria.imc !== undefined) this.variables.imc = biometria.imc;
    if (biometria.imcCategoria !== undefined) this.variables.imcCategoria = biometria.imcCategoria;
  }

  public setOcupacion(ocupacion: string): void {
    if (ocupacion.trim()) {
      this.variables.ocupacion = ocupacion.trim();
    }
  }

  public setCondicionesCronicas(texto: string): void {
    if (texto.trim()) {
      this.variables.condicionesCronicas = texto.trim();
    }
  }

  public setAlergenosDesencadenantes(texto: string): void {
    if (texto.trim()) {
      this.variables.alergenosDesencadenantes = texto.trim();
    }
  }

  public setMedicacionActual(texto: string): void {
    if (texto.trim()) {
      this.variables.medicacionActual = texto.trim();
    }
  }

  public setAlergiasMedicamentos(texto: string): void {
    if (texto.trim()) {
      this.variables.alergiasMedicamentos = texto.trim();
    }
  }

  public setAntecedentesFamiliares(antecedentes: Partial<AntecedentesFamiliaresVariables>): void {
    this.variables.antecedentesFamiliares = {
      ...this.variables.antecedentesFamiliares,
      ...antecedentes,
    };
  }

  public setListaMedicamentosParaInteracciones(texto: string): void {
    if (texto.trim()) {
      this.variables.listaMedicamentosParaInteracciones = texto.trim();
    }
  }

  public actualizarVariables(nuevas: Partial<PromptVariables>): void {
    this.variables = {
      ...this.variables,
      ...nuevas,
      antecedentesFamiliares: {
        ...this.variables.antecedentesFamiliares,
        ...(nuevas.antecedentesFamiliares || {}),
      },
    };
  }

  public getVariables(): PromptVariables {
    return { ...this.variables };
  }

  public generar(): string {
    return renderPromptClinico(this.variables);
  }
}

