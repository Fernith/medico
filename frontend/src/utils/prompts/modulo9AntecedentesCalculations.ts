import { apiClient } from '../../api/client';
import {
  type AlergiaItem,
  type PatologiaItem,
  type AntecedenteItem,
} from '../promptCalculations';
import {
  type FiltrosModulo9Antecedentes,
  type Modulo9AntecedentesVariables,
  formatearModulo9Antecedentes,
} from '../../features/usuario/prompts/promptModularTemplate';

export interface OpcionAntecedenteModulo9 {
  id: string;
  parentescoLabel: string;
  enfermedad: string;
  detalle: string;
}

const formatearParentesco = (parentesco: string): string => {
  const limpio = parentesco.replace(/_/g, ' ').trim();
  if (!limpio) return 'Familiar';
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

const formatearGravedadAlergia = (gravedad: string): string => {
  switch (gravedad) {
    case 'leve':
      return 'leve';
    case 'moderada':
      return 'moderada';
    case 'grave':
      return 'grave';
    case 'potencialmente_mortal':
      return 'potencialmente mortal / anafiláctica';
    default:
      return gravedad.replace(/_/g, ' ');
  }
};

const formatearDetalleAntecedente = (item: AntecedenteItem): string => {
  const partes: string[] = [];
  if (item.edad_diagnostico !== null && item.edad_diagnostico !== undefined) {
    partes.push(`diagnosticado a los ${item.edad_diagnostico} años`);
  }
  if (item.fallecido) {
    if (item.edad_fallecimiento !== null && item.edad_fallecimiento !== undefined) {
      partes.push(`fallecido a los ${item.edad_fallecimiento} años`);
    } else {
      partes.push('fallecido');
    }
  }
  if (item.detalles && item.detalles.trim()) {
    partes.push(item.detalles.trim());
  }
  return partes.join(', ');
};

/**
 * Obtiene la lista de antecedentes familiares registrados para poblar los filtros del Módulo 9
 */
export const obtenerOpcionesFiltroModulo9 = async (): Promise<OpcionAntecedenteModulo9[]> => {
  try {
    const res = await apiClient.get<AntecedenteItem[]>('/antecedentes');
    const lista = Array.isArray(res.data) ? res.data : [];

    return lista.map((item) => {
      const parentescoLabel = formatearParentesco(item.parentesco);
      const detalle = formatearDetalleAntecedente(item);
      return {
        id: item.id,
        parentescoLabel,
        enfermedad: item.enfermedad,
        detalle: detalle || 'Sin detalles adicionales',
      };
    });
  } catch (error) {
    console.error('Error al obtener opciones de filtro para el Módulo 9:', error);
    return [];
  }
};

/**
 * Compila el Módulo 9: Antecedentes Clínicos e Inmunológicos (Estático)
 */
export const compilarModulo9Antecedentes = async (
  filtros?: FiltrosModulo9Antecedentes
): Promise<string> => {
  const vars: Modulo9AntecedentesVariables = {
    antecedentesAlergiasListado: '',
    antecedentesPatologiasListado: '',
    antecedentesFamiliaresListado: '',
  };

  try {
    const [resAlergias, resPatologias, resAntecedentes] = await Promise.allSettled([
      apiClient.get<AlergiaItem[]>('/alergias').then((r) => r.data),
      apiClient.get<PatologiaItem[]>('/patologias').then((r) => r.data),
      apiClient.get<AntecedenteItem[]>('/antecedentes').then((r) => r.data),
    ]);

    const alergias =
      resAlergias.status === 'fulfilled' && Array.isArray(resAlergias.value)
        ? resAlergias.value
        : [];
    const patologias =
      resPatologias.status === 'fulfilled' && Array.isArray(resPatologias.value)
        ? resPatologias.value
        : [];
    const antecedentes =
      resAntecedentes.status === 'fulfilled' && Array.isArray(resAntecedentes.value)
        ? resAntecedentes.value
        : [];

    // 1. ANTECEDENTES_ALERGIAS_LISTADO
    if (alergias.length > 0) {
      const lineasAlergias = alergias.map((a) => {
        const tipoTexto = a.tipo === 'intolerancia' ? 'Intolerancia' : 'Alergia';
        const gravedadTexto = formatearGravedadAlergia(a.gravedad);
        const notasExtra = a.notas && a.notas.trim() ? ` - ${a.notas.trim()}` : '';
        return `  * ${a.sustancia}: ${a.reaccion} (${tipoTexto}, gravedad ${gravedadTexto}${notasExtra})`;
      });
      vars.antecedentesAlergiasListado = lineasAlergias.join('\n');
    }

    // 2. ANTECEDENTES_PATOLOGIAS_LISTADO
    const patologiasCronicas = patologias.filter((p) => p.estado !== 'resuelta');
    if (patologiasCronicas.length > 0) {
      const itemsPatologias = patologiasCronicas.map((p) => {
        const detalles: string[] = [];
        if (p.estado === 'controlada') detalles.push('controlada');
        if (p.estado === 'en_remision') detalles.push('en remisión');
        if (p.notas && p.notas.trim()) detalles.push(p.notas.trim());
        else if (p.tratamiento_actual && p.tratamiento_actual.trim()) {
          detalles.push(`manejo: ${p.tratamiento_actual.trim()}`);
        }
        return detalles.length > 0 ? `${p.nombre} (${detalles.join(', ')})` : p.nombre;
      });
      vars.antecedentesPatologiasListado = itemsPatologias.join('; ');
    }

    // 3. ANTECEDENTES_FAMILIARES_LISTADO
    // Regla 1: Si el listado de antecedentes familiares en BD está vacío, no poner la sección ('')
    if (antecedentes.length > 0) {
      const seleccionados = filtros
        ? antecedentes.filter((a) => filtros.antecedentesIds.includes(a.id))
        : antecedentes;

      // Regla 2: Si el usuario deselecciona todos los antecedentes familiares, indicar que no repercuten/influyen
      if (seleccionados.length === 0) {
        vars.antecedentesFamiliaresListado =
          'Sin antecedentes familiares que repercutan o influyan en esta consulta.';
      } else {
        // Regla 3: Mostrar los antecedentes seleccionados
        const textosFamiliares = seleccionados.map((item) => {
          const parentesco = formatearParentesco(item.parentesco);
          const detalle = formatearDetalleAntecedente(item);
          return detalle
            ? `${parentesco} con ${item.enfermedad} (${detalle})`
            : `${parentesco} con ${item.enfermedad}`;
        });
        vars.antecedentesFamiliaresListado = textosFamiliares.join('; ');
      }
    }
  } catch (error) {
    console.error('Error al compilar el Módulo 9 (Antecedentes e Inmunología):', error);
  }

  return formatearModulo9Antecedentes(vars);
};

