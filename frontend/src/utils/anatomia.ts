export interface LocalizacionAnatomica {
  id: string;
  nombre: string;
  nivel: number;
  parent_id: string | null;
  es_bilateral: boolean;
}

export const CATALOGO_ANATOMIA: LocalizacionAnatomica[] = [
  // ==========================================
  // NIVEL 0: GENERAL
  // ==========================================
  { id: 'sistemico', nombre: 'Sistémico / General', nivel: 0, parent_id: null, es_bilateral: false },

  // ==========================================
  // NIVEL 1: ZONAS PRINCIPALES
  // ==========================================
  { id: 'cabeza_cuello', nombre: 'Cabeza y Cuello', nivel: 1, parent_id: null, es_bilateral: false },
  { id: 'tronco', nombre: 'Tronco', nivel: 1, parent_id: null, es_bilateral: false },
  { id: 'ext_sup', nombre: 'Extremidad Superior', nivel: 1, parent_id: null, es_bilateral: true },
  { id: 'ext_inf', nombre: 'Extremidad Inferior', nivel: 1, parent_id: null, es_bilateral: true },

  // ==========================================
  // NIVEL 2: SUBZONAS
  // ==========================================
  // Cabeza y Cuello
  { id: 'craneo', nombre: 'Cráneo', nivel: 2, parent_id: 'cabeza_cuello', es_bilateral: false },
  { id: 'cara', nombre: 'Cara', nivel: 2, parent_id: 'cabeza_cuello', es_bilateral: false },
  { id: 'cuello', nombre: 'Cuello', nivel: 2, parent_id: 'cabeza_cuello', es_bilateral: false },

  // Tronco
  { id: 'torax', nombre: 'Tórax', nivel: 2, parent_id: 'tronco', es_bilateral: false },
  { id: 'abdomen', nombre: 'Abdomen', nivel: 2, parent_id: 'tronco', es_bilateral: false },
  { id: 'pelvis', nombre: 'Pelvis / Genitales', nivel: 2, parent_id: 'tronco', es_bilateral: false },
  { id: 'espalda', nombre: 'Espalda', nivel: 2, parent_id: 'tronco', es_bilateral: false },

  // Extremidad Superior
  { id: 'hombro', nombre: 'Hombro', nivel: 2, parent_id: 'ext_sup', es_bilateral: true },
  { id: 'brazo', nombre: 'Brazo', nivel: 2, parent_id: 'ext_sup', es_bilateral: true },
  { id: 'codo', nombre: 'Codo', nivel: 2, parent_id: 'ext_sup', es_bilateral: true },
  { id: 'antebrazo', nombre: 'Antebrazo', nivel: 2, parent_id: 'ext_sup', es_bilateral: true },
  { id: 'muneca', nombre: 'Muñeca', nivel: 2, parent_id: 'ext_sup', es_bilateral: true },
  { id: 'mano', nombre: 'Mano', nivel: 2, parent_id: 'ext_sup', es_bilateral: true },

  // Extremidad Inferior
  { id: 'cadera_gluteo', nombre: 'Cadera / Glúteo', nivel: 2, parent_id: 'ext_inf', es_bilateral: true },
  { id: 'muslo', nombre: 'Muslo', nivel: 2, parent_id: 'ext_inf', es_bilateral: true },
  { id: 'rodilla', nombre: 'Rodilla', nivel: 2, parent_id: 'ext_inf', es_bilateral: true },
  { id: 'pierna', nombre: 'Pierna', nivel: 2, parent_id: 'ext_inf', es_bilateral: true },
  { id: 'tobillo', nombre: 'Tobillo', nivel: 2, parent_id: 'ext_inf', es_bilateral: true },
  { id: 'pie', nombre: 'Pie', nivel: 2, parent_id: 'ext_inf', es_bilateral: true },

  // ==========================================
  // NIVEL 3: DETALLE ESPECÍFICO
  // ==========================================
  // Hijos de Cráneo
  { id: 'cuero_cabelludo', nombre: 'Cuero cabelludo', nivel: 3, parent_id: 'craneo', es_bilateral: false },
  { id: 'nuca', nombre: 'Nuca', nivel: 3, parent_id: 'craneo', es_bilateral: false },

  // Hijos de Cara
  { id: 'frente', nombre: 'Frente', nivel: 3, parent_id: 'cara', es_bilateral: false },
  { id: 'entrecejo', nombre: 'Entrecejo', nivel: 3, parent_id: 'cara', es_bilateral: false },
  { id: 'ojos', nombre: 'Ojos', nivel: 3, parent_id: 'cara', es_bilateral: true },
  { id: 'nariz', nombre: 'Nariz', nivel: 3, parent_id: 'cara', es_bilateral: false },
  { id: 'mejillas', nombre: 'Mejillas', nivel: 3, parent_id: 'cara', es_bilateral: true },
  { id: 'boca_labios', nombre: 'Boca / Labios', nivel: 3, parent_id: 'cara', es_bilateral: false },
  { id: 'mandibula', nombre: 'Mandíbula', nivel: 3, parent_id: 'cara', es_bilateral: true },

  // Hijos de Cuello
  { id: 'garganta', nombre: 'Garganta', nivel: 3, parent_id: 'cuello', es_bilateral: false },
  { id: 'cervicales', nombre: 'Cervicales', nivel: 3, parent_id: 'cuello', es_bilateral: false },

  // Hijos de Tórax
  { id: 'pecho', nombre: 'Pecho / Pectoral', nivel: 3, parent_id: 'torax', es_bilateral: true },
  { id: 'costillas', nombre: 'Costillas', nivel: 3, parent_id: 'torax', es_bilateral: true },

  // Hijos de Abdomen
  { id: 'abdomen_sup', nombre: 'Superior', nivel: 3, parent_id: 'abdomen', es_bilateral: true }, // Permite cuadrante superior izq/der
  { id: 'abdomen_inf', nombre: 'Inferior', nivel: 3, parent_id: 'abdomen', es_bilateral: true }, // Permite cuadrante inferior izq/der
  { id: 'ombligo', nombre: 'Ombligo', nivel: 3, parent_id: 'abdomen', es_bilateral: false },

  // Hijos de Espalda
  { id: 'dorsal', nombre: 'Dorsal', nivel: 3, parent_id: 'espalda', es_bilateral: true },
  { id: 'lumbar', nombre: 'Lumbar', nivel: 3, parent_id: 'espalda', es_bilateral: true },
  { id: 'sacro', nombre: 'Sacro / Coxis', nivel: 3, parent_id: 'espalda', es_bilateral: false },

  // Hijos de Mano
  { id: 'palma_mano', nombre: 'Palma', nivel: 3, parent_id: 'mano', es_bilateral: true },
  { id: 'dorso_mano', nombre: 'Dorso', nivel: 3, parent_id: 'mano', es_bilateral: true },
  { id: 'dedos_mano', nombre: 'Dedos', nivel: 3, parent_id: 'mano', es_bilateral: true },

  // Hijos de Muslo
  { id: 'cuadriceps', nombre: 'Cuádriceps', nivel: 3, parent_id: 'muslo', es_bilateral: true },
  { id: 'isquiotibiales', nombre: 'Isquiotibiales', nivel: 3, parent_id: 'muslo', es_bilateral: true },

  // Hijos de Pierna
  { id: 'espinilla', nombre: 'Espinilla', nivel: 3, parent_id: 'pierna', es_bilateral: true },
  { id: 'pantorrilla', nombre: 'Pantorrilla / Gemelo', nivel: 3, parent_id: 'pierna', es_bilateral: true },

  // Hijos de Pie
  { id: 'planta_pie', nombre: 'Planta', nivel: 3, parent_id: 'pie', es_bilateral: true },
  { id: 'empeine_pie', nombre: 'Empeine', nivel: 3, parent_id: 'pie', es_bilateral: true },
  { id: 'talon_pie', nombre: 'Talón', nivel: 3, parent_id: 'pie', es_bilateral: true },
  { id: 'dedos_pie', nombre: 'Dedos', nivel: 3, parent_id: 'pie', es_bilateral: true },
];

export const SINTOMAS_POR_LOCALIZACION: Record<string, string[]> = {
  ojos: ['Oftalmológico y ORL', 'Musculoesquelético'],
  garganta: ['Oftalmológico y ORL', 'Musculoesquelético'],
  nariz: ['Oftalmológico y ORL', 'Dermatológico', 'Musculoesquelético'],
  boca_labios: ['Oftalmológico y ORL', 'Dermatológico', 'Musculoesquelético'],
  torax: ['Musculoesquelético', 'Dermatológico', 'Cardiovascular', 'Respiratorio'],
  pecho: ['Musculoesquelético', 'Dermatológico', 'Cardiovascular', 'Respiratorio'],
  costillas: ['Musculoesquelético', 'Respiratorio'],
  abdomen: ['Musculoesquelético', 'Dermatológico', 'Digestivo'],
  abdomen_sup: ['Digestivo', 'Musculoesquelético'],
  abdomen_inf: ['Digestivo', 'Urológico y Reproductivo', 'Musculoesquelético'],
  pelvis: ['Urológico y Reproductivo', 'Digestivo', 'Musculoesquelético', 'Dermatológico'],
  espalda: ['Musculoesquelético', 'Dermatológico', 'Neurológico'],
  dorsal: ['Musculoesquelético', 'Neurológico'],
  lumbar: ['Musculoesquelético', 'Neurológico'],
  sacro: ['Musculoesquelético', 'Neurológico'],
  sistemico: ['Sistémico / General', 'Estado de Ánimo y Cognitivo', 'Otros'],
  
  // Default general mapping for remaining categories based on logical tissue inheritance
  cabeza_cuello: ['Oftalmológico y ORL', 'Musculoesquelético', 'Dermatológico', 'Neurológico'],
  tronco: ['Musculoesquelético', 'Dermatológico', 'Cardiovascular', 'Respiratorio', 'Digestivo', 'Urológico y Reproductivo'],
  ext_sup: ['Musculoesquelético', 'Dermatológico', 'Neurológico'],
  ext_inf: ['Musculoesquelético', 'Dermatológico', 'Neurológico'],
};

/**
 * Dada una lista de IDs de localizaciones anatómicas seleccionadas,
 * devuelve un array con las categorías de síntomas permitidas.
 */
export const getCategoriasParaZonas = (zonas: string[]): string[] => {
  if (zonas.length === 0) {
    return ['Sistémico / General', 'Estado de Ánimo y Cognitivo', 'Otros'];
  }

  const categorias = new Set<string>();

  for (const zonaId of zonas) {
    let currentId: string | null = zonaId;
    let found = false;

    while (currentId) {
      if (SINTOMAS_POR_LOCALIZACION[currentId]) {
        SINTOMAS_POR_LOCALIZACION[currentId].forEach(c => categorias.add(c));
        found = true;
        break;
      }
      
      const loc = CATALOGO_ANATOMIA.find(c => c.id === currentId);
      currentId = loc ? loc.parent_id : null;
    }

    if (!found) {
      // Fallback si no se encontró nada en el árbol
      categorias.add('Musculoesquelético');
      categorias.add('Dermatológico');
    }
  }

  return Array.from(categorias);
};