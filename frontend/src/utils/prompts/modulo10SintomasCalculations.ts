import { apiFetch } from '../../api/client';
import { type OcurrenciaSintoma } from '../../features/sintomas/SintomasTabla';
import { CATALOGO_ANATOMIA, type LocalizacionAnatomica } from '../anatomia';
import { formatearFecha } from '../formatters';
import {
  type TipoPromptModular,
  type FiltrosModulo10Sintomas,
  type VentanaDiasTriajeSintomas,
  type VentanaDiasPredictivoSintomas,
  type MinRepeticionesPredictivoSintomas,
  formatearModulo10ASintomasTriaje,
  formatearModulo10BSintomasPredictivo,
} from '../../features/usuario/prompts/promptModularTemplate';

export interface OpcionSintomaTriajeMod10 {
  id: string;
  fechaInicio: string;
  fechaLegible: string;
  diasAtras: number;
  sintomaNombre: string;
  zonaTexto: string;
  resumenValor: string;
}

export interface OpcionFocoPredictivoMod10 {
  clave: string;
  zonaLabel: string;
  veces: number;
  intensidadMediaTexto: string;
  ultimoEpisodioDias: number;
  ultimoEpisodioTexto: string;
}

const buscarNodoAnatomia = (id: string): LocalizacionAnatomica | undefined => {
  return CATALOGO_ANATOMIA.find((n) => n.id === id);
};

const formatearLadoAdjunto = (lado: string | null | undefined): string => {
  if (!lado) return '';
  const l = lado.toLowerCase();
  if (l === 'derecho') return ' derecho';
  if (l === 'izquierdo') return ' izquierdo';
  if (l === 'ambos') return ' bilateral';
  return ` (${lado})`;
};

/**
 * Construye la ruta jerárquica completa N1 > N2 > N3 a partir de localizacion_id
 */
export const construirRutaAnatomicaCompleta = (
  localizacionId: string,
  lado?: string | null,
  esIrradiado?: boolean
): string => {
  const nodoActual = buscarNodoAnatomia(localizacionId);
  if (!nodoActual) {
    return `${localizacionId}${formatearLadoAdjunto(lado)}${esIrradiado ? ' (irradiado)' : ''}`;
  }

  const cadena: LocalizacionAnatomica[] = [];
  let cursor: LocalizacionAnatomica | undefined = nodoActual;
  while (cursor) {
    cadena.unshift(cursor);
    cursor = cursor.parent_id ? buscarNodoAnatomia(cursor.parent_id) : undefined;
  }

  // Añadir el lado en el nodo de Nivel 2 (o en el último nodo si no hay Nivel 2)
  const indiceConLado = cadena.findIndex((n) => n.nivel === 2);
  const targetIdx = indiceConLado !== -1 ? indiceConLado : cadena.length - 1;

  const nombres = cadena.map((n, idx) => {
    if (idx === targetIdx && lado) {
      return `${n.nombre}${formatearLadoAdjunto(lado)}`;
    }
    return n.nombre;
  });

  const ruta = nombres.join(' > ');
  return esIrradiado ? `${ruta} (irradiado)` : ruta;
};

/**
 * Resuelve cualquier localizacion_id a su nodo anatómico de Nivel 2 (N1 > N2) para agregación
 */
export const resolverZonaNivel2 = (
  localizacionId: string,
  lado: string | null | undefined,
  sintomaNombreFallback: string
): { clave: string; zonaLabel: string } => {
  const nodo = buscarNodoAnatomia(localizacionId);
  if (!nodo) {
    const sufijo = formatearLadoAdjunto(lado);
    return {
      clave: `${localizacionId}_${(lado || 'ninguno').toLowerCase()}`,
      zonaLabel: `${localizacionId}${sufijo}`,
    };
  }

  if (nodo.nivel === 0) {
    return {
      clave: `sistemico_${sintomaNombreFallback.toLowerCase()}`,
      zonaLabel: `${nodo.nombre} (${sintomaNombreFallback})`,
    };
  }

  if (nodo.nivel === 1) {
    const sufijo = formatearLadoAdjunto(lado);
    return {
      clave: `${nodo.id}_${(lado || 'ninguno').toLowerCase()}`,
      zonaLabel: `${nodo.nombre}${sufijo}`,
    };
  }

  // Si es nivel 3, subir al padre de nivel 2
  const nodoNivel2 =
    nodo.nivel === 3 && nodo.parent_id
      ? buscarNodoAnatomia(nodo.parent_id) || nodo
      : nodo;

  const nodoNivel1 = nodoNivel2.parent_id
    ? buscarNodoAnatomia(nodoNivel2.parent_id)
    : undefined;

  const sufijoLado = formatearLadoAdjunto(lado);
  const nombreNivel2ConLado = `${nodoNivel2.nombre}${sufijoLado}`;
  const zonaLabel = nodoNivel1
    ? `${nodoNivel1.nombre} > ${nombreNivel2ConLado}`
    : nombreNivel2ConLado;

  const clave = `${nodoNivel2.id}_${(lado || 'ninguno').toLowerCase()}`;
  return { clave, zonaLabel };
};

const formatearZonasOcurrenciaTriaje = (o: OcurrenciaSintoma): string => {
  if (!o.localizaciones || o.localizaciones.length === 0) {
    return 'Sistémico / General';
  }

  const principales = o.localizaciones.filter((l) => !l.es_irradiado);
  const irradiadas = o.localizaciones.filter((l) => l.es_irradiado);

  const baseLista = principales.length > 0 ? principales : o.localizaciones;
  const textoPrincipales = baseLista
    .map((l) => construirRutaAnatomicaCompleta(l.localizacion_id, l.lado, false))
    .join(' + ');

  if (principales.length > 0 && irradiadas.length > 0) {
    const textoIrradiadas = irradiadas
      .map((l) => construirRutaAnatomicaCompleta(l.localizacion_id, l.lado, false))
      .join(', ');
    return `${textoPrincipales} (irradia a: ${textoIrradiadas})`;
  }

  return textoPrincipales;
};

const formatearCaracteristica = (caracteristica: string | null): string => {
  if (!caracteristica) return '';
  switch (caracteristica) {
    case 'punzante':
      return 'punzante';
    case 'opresivo':
      return 'opresivo';
    case 'urente_ardor':
      return 'urente / ardor';
    case 'sordo':
      return 'sordo';
    case 'colico':
      return 'cólico';
    case 'electrico':
      return 'eléctrico';
    case 'hormigueo':
      return 'hormigueo / adormecimiento';
    case 'pesadez':
      return 'pesadez';
    case 'otro':
      return 'otro';
    default:
      return caracteristica.replace(/_/g, ' ');
  }
};

const formatearFrecuencia = (frecuencia: string | null): string => {
  if (!frecuencia) return '';
  switch (frecuencia) {
    case 'unico_episodio':
      return 'único episodio';
    case 'intermitente':
      return 'intermitente';
    case 'constante':
      return 'constante';
    default:
      return frecuencia.replace(/_/g, ' ');
  }
};

const formatearValorSintoma = (
  regla: string,
  valor: string | null
): { etiquetaCompleta: string; resumenCorto: string } => {
  if (!valor) {
    return { etiquetaCompleta: '', resumenCorto: 'Sin valor' };
  }
  switch (regla) {
    case 'escala_1_10':
      return {
        etiquetaCompleta: `Intensidad EVA ${valor}/10`,
        resumenCorto: `EVA ${valor}/10`,
      };
    case 'cualitativa_3': {
      const txt =
        valor === '1' ? 'Leve (1/3)' : valor === '2' ? 'Moderada (2/3)' : 'Grave (3/3)';
      return {
        etiquetaCompleta: `Intensidad ${txt}`,
        resumenCorto: txt,
      };
    }
    case 'grados_celsius':
      return {
        etiquetaCompleta: `Temperatura ${valor} °C`,
        resumenCorto: `${valor} °C`,
      };
    case 'conteo_episodios': {
      const ep = valor === '1' ? '1 episodio' : `${valor} episodios`;
      return {
        etiquetaCompleta: `Frecuencia cuantificada: ${ep}`,
        resumenCorto: ep,
      };
    }
    case 'presencia_booleana': {
      const pres = valor === 'true' ? 'Presente' : 'Ausente';
      return {
        etiquetaCompleta: `Estado: ${pres}`,
        resumenCorto: pres,
      };
    }
    default:
      return {
        etiquetaCompleta: `Medición: ${valor}`,
        resumenCorto: valor,
      };
  }
};

const calcularDuracionTexto = (fechaInicioIso: string, fechaFinIso: string | null): string => {
  const inicioMs = new Date(fechaInicioIso).getTime();
  if (isNaN(inicioMs)) return 'No especificada';

  const finMs = fechaFinIso ? new Date(fechaFinIso).getTime() : Date.now();
  const diffMs = Math.max(0, finMs - inicioMs);
  const horas = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (horas < 48) {
    return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }
  const dias = Math.round(horas / 24);
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
};

const calcularDiasDesde = (fechaIso: string): number => {
  const fechaMs = new Date(fechaIso).getTime();
  if (isNaN(fechaMs)) return 0;
  const diffMs = Math.max(0, Date.now() - fechaMs);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const fetchTodasLasOcurrenciasSintomas = async (): Promise<OcurrenciaSintoma[]> => {
  try {
    const res = await apiFetch('/api/sintomas/ocurrencias');
    if (!res.ok) return [];
    const data = (await res.json()) as OcurrenciaSintoma[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error al obtener ocurrencias de síntomas:', error);
    return [];
  }
};

/**
 * Construye las opciones de síntomas recientes para el modo Triaje (10A)
 */
export const construirOpcionesTriajeMod10 = (
  ocurrencias: OcurrenciaSintoma[],
  ventanaDias: VentanaDiasTriajeSintomas
): OpcionSintomaTriajeMod10[] => {
  const limiteMs = Date.now() - ventanaDias * 24 * 60 * 60 * 1000;

  return ocurrencias
    .filter((o) => {
      const ms = new Date(o.fecha_inicio).getTime();
      return !isNaN(ms) && ms >= limiteMs;
    })
    .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
    .map((o) => {
      const zonaTexto = formatearZonasOcurrenciaTriaje(o);
      const { resumenCorto } = formatearValorSintoma(o.regla_medicion, o.valor_registro);
      return {
        id: o.id,
        fechaInicio: o.fecha_inicio,
        fechaLegible: formatearFecha(o.fecha_inicio),
        diasAtras: calcularDiasDesde(o.fecha_inicio),
        sintomaNombre: o.sintoma_nombre,
        zonaTexto,
        resumenValor: resumenCorto,
      };
    });
};

/**
 * Construye la matriz de focos anatómicos (Nivel 2) para el modo Predictivo (10B)
 */
export const construirOpcionesPredictivoMod10 = (
  ocurrencias: OcurrenciaSintoma[],
  ventanaDias: VentanaDiasPredictivoSintomas,
  minRepeticiones: MinRepeticionesPredictivoSintomas
): OpcionFocoPredictivoMod10[] => {
  const limiteMs = Date.now() - ventanaDias * 24 * 60 * 60 * 1000;

  interface AcumuladorFoco {
    clave: string;
    zonaLabel: string;
    ocurrenciasIds: Set<string>;
    valoresEscala10: number[];
    ultimoTimestamp: number;
    ultimaFechaIso: string;
  }

  const mapa = new Map<string, AcumuladorFoco>();

  for (const o of ocurrencias) {
    const ms = new Date(o.fecha_inicio).getTime();
    if (isNaN(ms) || ms < limiteMs) continue;

    // Resolver las zonas de Nivel 2 únicas dentro de esta ocurrencia
    const zonasDeOcurrencia = new Map<string, string>();
    if (!o.localizaciones || o.localizaciones.length === 0) {
      const z = resolverZonaNivel2('sistemico', null, o.sintoma_nombre);
      zonasDeOcurrencia.set(z.clave, z.zonaLabel);
    } else {
      for (const loc of o.localizaciones) {
        const z = resolverZonaNivel2(loc.localizacion_id, loc.lado, o.sintoma_nombre);
        zonasDeOcurrencia.set(z.clave, z.zonaLabel);
      }
    }

    // Extraer valor numérico normalizado a /10 si aplica
    let valorNum10: number | null = null;
    if (o.valor_registro) {
      const parsed = parseFloat(o.valor_registro);
      if (!isNaN(parsed)) {
        if (o.regla_medicion === 'escala_1_10') {
          valorNum10 = parsed;
        } else if (o.regla_medicion === 'cualitativa_3') {
          valorNum10 = parsed === 1 ? 3.3 : parsed === 2 ? 6.7 : 10;
        }
      }
    }

    for (const [clave, zonaLabel] of zonasDeOcurrencia.entries()) {
      let item = mapa.get(clave);
      if (!item) {
        item = {
          clave,
          zonaLabel,
          ocurrenciasIds: new Set<string>(),
          valoresEscala10: [],
          ultimoTimestamp: ms,
          ultimaFechaIso: o.fecha_inicio,
        };
        mapa.set(clave, item);
      }

      if (!item.ocurrenciasIds.has(o.id)) {
        item.ocurrenciasIds.add(o.id);
        if (valorNum10 !== null) {
          item.valoresEscala10.push(valorNum10);
        }
        if (ms > item.ultimoTimestamp) {
          item.ultimoTimestamp = ms;
          item.ultimaFechaIso = o.fecha_inicio;
        }
      }
    }
  }

  const resultado: OpcionFocoPredictivoMod10[] = [];

  for (const item of mapa.values()) {
    const veces = item.ocurrenciasIds.size;
    if (veces < minRepeticiones) continue;

    let intensidadMediaTexto = 'Intensidad media: N/A';
    if (item.valoresEscala10.length > 0) {
      const suma = item.valoresEscala10.reduce((acc, v) => acc + v, 0);
      const media = Math.round((suma / item.valoresEscala10.length) * 10) / 10;
      intensidadMediaTexto = `Intensidad media: ${media}/10`;
    }

    const dias = calcularDiasDesde(item.ultimaFechaIso);
    const ultimoEpisodioTexto =
      dias === 0 ? 'hoy' : dias === 1 ? 'hace 1 día' : `hace ${dias} días`;

    resultado.push({
      clave: item.clave,
      zonaLabel: item.zonaLabel,
      veces,
      intensidadMediaTexto,
      ultimoEpisodioDias: dias,
      ultimoEpisodioTexto,
    });
  }

  // Ordenar por mayor número de repeticiones y luego por más reciente
  resultado.sort((a, b) => {
    if (b.veces !== a.veces) return b.veces - a.veces;
    return a.ultimoEpisodioDias - b.ultimoEpisodioDias;
  });

  return resultado;
};

/**
 * Compila el Módulo 10 según el tipo de consulta ('triaje' -> 10A, 'predictivo' -> 10B)
 */
export const compilarModulo10Sintomas = async (
  tipo: TipoPromptModular,
  filtros?: FiltrosModulo10Sintomas
): Promise<string> => {
  const ocurrencias = await fetchTodasLasOcurrenciasSintomas();

  if (tipo === 'triaje') {
    const ventanaDias: VentanaDiasTriajeSintomas = filtros?.ventanaDiasTriaje ?? 7;
    const limiteMs = Date.now() - ventanaDias * 24 * 60 * 60 * 1000;

    const recientes = ocurrencias
      .filter((o) => {
        const ms = new Date(o.fecha_inicio).getTime();
        return !isNaN(ms) && ms >= limiteMs;
      })
      .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());

    if (recientes.length === 0) {
      return formatearModulo10ASintomasTriaje({
        sintomasSeleccionadosListado: `Sin síntomas registrados en el periodo de los últimos ${ventanaDias} días.`,
      });
    }

    const seleccionadas = filtros
      ? recientes.filter((o) => filtros.sintomasSeleccionadosIds.includes(o.id))
      : recientes;

    if (seleccionadas.length === 0) {
      return formatearModulo10ASintomasTriaje({
        sintomasSeleccionadosListado:
          'Ningún síntoma estructurado seleccionado por el usuario. Evaluar exclusivamente mediante el texto libre del motivo de consulta.',
      });
    }

    const lineas = seleccionadas.map((o) => {
      const zona = formatearZonasOcurrenciaTriaje(o);
      const partes: string[] = [];

      const caract = formatearCaracteristica(o.caracteristica);
      if (caract) {
        partes.push(`Tipo ${caract}`);
      }

      const { etiquetaCompleta } = formatearValorSintoma(o.regla_medicion, o.valor_registro);
      if (etiquetaCompleta) {
        partes.push(etiquetaCompleta);
      }

      const frec = formatearFrecuencia(o.frecuencia);
      if (frec) {
        partes.push(`Frecuencia ${frec}`);
      }

      const alivia = (o.modificadores || [])
        .filter((m) => m.efecto === 'alivia')
        .map((m) => m.factor);
      if (alivia.length > 0) {
        partes.push(`Mejora con: ${alivia.join(', ')}`);
      }

      const empeora = (o.modificadores || [])
        .filter((m) => m.efecto === 'empeora')
        .map((m) => m.factor);
      if (empeora.length > 0) {
        partes.push(`Empeora con: ${empeora.join(', ')}`);
      }

      const duracion = calcularDuracionTexto(o.fecha_inicio, o.fecha_fin);
      partes.push(`Duración: ${duracion}`);

      if (o.notas && o.notas.trim()) {
        partes.push(`Notas: ${o.notas.trim()}`);
      }

      return `- ${zona} (${o.sintoma_nombre}): ${partes.join(' | ')}`;
    });

    return formatearModulo10ASintomasTriaje({
      sintomasSeleccionadosListado: lineas.join('\n'),
    });
  }

  // Modo Predictivo (10B)
  const ventanaPredictivo: VentanaDiasPredictivoSintomas =
    filtros?.ventanaDiasPredictivo ?? 180;
  const minRepeticiones: MinRepeticionesPredictivoSintomas =
    filtros?.minRepeticionesPredictivo ?? 2;

  const focos = construirOpcionesPredictivoMod10(
    ocurrencias,
    ventanaPredictivo,
    minRepeticiones
  );

  if (focos.length === 0) {
    const etiquetaTipo = minRepeticiones >= 2 ? 'síntomas recurrentes' : 'síntomas';
    return formatearModulo10BSintomasPredictivo({
      matrizRecurrenciaSintomas90_180d: `Sin ${etiquetaTipo} registrados en el periodo de los últimos ${ventanaPredictivo} días.`,
    });
  }

  const focosFiltrados = filtros
    ? focos.filter((f) => filtros.focosSeleccionadosClaves.includes(f.clave))
    : focos;

  if (focosFiltrados.length === 0) {
    return formatearModulo10BSintomasPredictivo({
      matrizRecurrenciaSintomas90_180d:
        'Ningún foco sintomático seleccionado por el usuario para evaluar en esta consulta.',
    });
  }

  const lineasFocos = focosFiltrados.map(
    (f) =>
      `  * ${f.zonaLabel}: Registrado ${f.veces} ${
        f.veces === 1 ? 'vez' : 'veces'
      } en los últimos ${ventanaPredictivo} días | ${
        f.intensidadMediaTexto
      } | Último episodio: ${f.ultimoEpisodioTexto}`
  );

  return formatearModulo10BSintomasPredictivo({
    matrizRecurrenciaSintomas90_180d: lineasFocos.join('\n'),
  });
};

