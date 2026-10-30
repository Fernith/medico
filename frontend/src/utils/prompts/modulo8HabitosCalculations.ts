import { apiClient } from '../../api/client';
import {
  type HabitoToxicoItem,
  HABITOS_BASE,
} from '../../features/usuario/HabitosToxicosForm';
import { formatearModulo8Habitos } from '../../features/usuario/prompts/promptModularTemplate';

const labelFrecuencia = (frec: HabitoToxicoItem['frecuencia']): string => {
  if (!frec) return 'No especificada';
  switch (frec) {
    case 'diario':
      return 'Diario';
    case 'semanal':
      return 'Semanal';
    case 'fin_de_semana':
      return 'Fines de semana';
    case 'social':
      return 'Social / Eventos';
    case 'ocasional':
      return 'Esporádico / Ocasional';
    default:
      return frec;
  }
};

const factorDiarioFrecuencia = (frec: HabitoToxicoItem['frecuencia']): number => {
  switch (frec) {
    case 'diario':
      return 1.0;
    case 'fin_de_semana':
      return 2 / 7;
    case 'semanal':
      return 1 / 7;
    case 'social':
      return 1 / 7;
    case 'ocasional':
      return 0.05;
    default:
      return 1.0;
  }
};

const estimarMgPorToma = (item: HabitoToxicoItem): number => {
  const textoCantidad = (item.cantidad || '').toLowerCase();
  const textoNotas = (item.notas || '').toLowerCase();
  const combinado = `${textoCantidad} ${textoNotas}`;

  // Si especifica directamente miligramos (ej. "200 mg")
  const matchMg = textoCantidad.match(/(\d+(?:[.,]\d+)?)\s*mg\b/i);
  if (matchMg) {
    const val = parseFloat(matchMg[1].replace(',', '.'));
    if (!isNaN(val)) return val;
  }

  // Extraer numero de unidades (por defecto 1)
  const matchNum = textoCantidad.match(/(\d+(?:[.,]\d+)?)/);
  const unidades = matchNum
    ? Math.max(0, parseFloat(matchNum[1].replace(',', '.')))
    : 1;

  if (item.clave === 'bebidas_energeticas') {
    return unidades * 120;
  }

  // Para cafeina: distinguir si menciona te / infusion vs cafe / espresso
  if (/\b(te|té|infusion|infusión|matcha)\b/i.test(combinado) && !/\bcaf[eé]\b/i.test(combinado)) {
    return unidades * 45;
  }

  return unidades * 85;
};

const calcularCargaEstimulantes = (habitos: HabitoToxicoItem[]): string => {
  const estimulantesActivos = habitos.filter(
    (h) =>
      (h.clave === 'cafeina' || h.clave === 'bebidas_energeticas') &&
      h.estado === 'consumo_activo'
  );

  if (estimulantesActivos.length === 0) {
    return 'Nula (0 mg cafeína/día)';
  }

  let totalMgDia = 0;
  for (const item of estimulantesActivos) {
    const mgBase = estimarMgPorToma(item);
    const factor = factorDiarioFrecuencia(item.frecuencia);
    totalMgDia += mgBase * factor;
  }

  if (totalMgDia < 100) {
    return 'Baja (< 100 mg cafeína/día)';
  }
  if (totalMgDia <= 300) {
    return 'Moderada (100-300 mg cafeína/día)';
  }
  return 'Elevada (> 300 mg cafeína/día)';
};

/**
 * Compila y formatea el Modulo 8: Toxicos y Habitos Basales.
 * Reutiliza HabitoToxicoItem y HABITOS_BASE de HabitosToxicosForm.tsx.
 */
export const compilarModulo8Habitos = async (): Promise<string> => {
  try {
    let listaCompleta: HabitoToxicoItem[] = [...HABITOS_BASE];

    try {
      const res = await apiClient.get<HabitoToxicoItem[]>('/habitos-toxicos');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapExistentes = new Map(res.data.map((item) => [item.clave, item]));
        listaCompleta = HABITOS_BASE.map((base) => {
          const existente = mapExistentes.get(base.clave);
          return existente ? { ...existente } : base;
        });
      }
    } catch {
      // Si falla la peticion usa HABITOS_BASE por defecto
    }

    const vinetasActivos: string[] = [];
    const nombresNegativos: string[] = [];

    for (const item of listaCompleta) {
      if (item.estado === 'consumo_activo') {
        const frec = labelFrecuencia(item.frecuencia);
        const cant = item.cantidad?.trim() || 'No especificada';
        const obs = item.notas?.trim() ? ` | Obs: ${item.notas.trim()}` : '';
        vinetasActivos.push(
          `  * ${item.nombre}: ${frec} | Cantidad: ${cant}${obs}`
        );
      } else if (item.estado === 'ex_consumidor') {
        const obs = item.notas?.trim() ? ` | Obs: ${item.notas.trim()}` : '';
        vinetasActivos.push(`  * ${item.nombre}: Ex-consumidor${obs}`);
      } else {
        nombresNegativos.push(item.nombre);
      }
    }

    const habitosToxicosActivos =
      vinetasActivos.length > 0 ? vinetasActivos.join('\n') : '';
    const habitosToxicosNegativos =
      nombresNegativos.length > 0 ? nombresNegativos.join(', ') : '';
    const cargaEstimulantesDiaria = calcularCargaEstimulantes(listaCompleta);

    return formatearModulo8Habitos({
      habitosToxicosActivos,
      habitosToxicosNegativos,
      cargaEstimulantesDiaria,
    });
  } catch (error) {
    console.error('Error al compilar el Modulo 8 de habitos y toxicos:', error);
    return formatearModulo8Habitos({
      habitosToxicosActivos: '',
      habitosToxicosNegativos: '',
      cargaEstimulantesDiaria: '--',
    });
  }
};

