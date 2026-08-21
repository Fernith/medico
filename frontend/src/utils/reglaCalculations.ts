export interface Ciclo {
  id: string;
  fecha_inicio: string; // Formato YYYY-MM-DD
  fecha_fin: string | null;
}

export type DiaEstado = 'periodo_real' | 'periodo_predicho' | 'ovulacion' | 'nada';

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const generarMapaEstados = (
  ciclos: Ciclo[], 
  mediaCiclo: number, 
  mediaPeriodo: number, 
  añoLimite: number
): Record<string, DiaEstado> => {
  const mapa: Record<string, DiaEstado> = {};
  if (!ciclos || ciclos.length === 0) return mapa;

  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parseDate = (str: string) => {
    const [y, m, d] = str.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (date: Date) => {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  };

  const ciclosOrdenados = [...ciclos].sort((a, b) => 
    parseDate(a.fecha_inicio).getTime() - parseDate(b.fecha_inicio).getTime()
  );

  // 1. Registrar los periodos reales
  ciclosOrdenados.forEach(ciclo => {
    const inicio = parseDate(ciclo.fecha_inicio);
    
    let fin: Date;
    if (ciclo.fecha_fin) {
      fin = parseDate(ciclo.fecha_fin);
    } else {
      const finEstimado = addDays(inicio, mediaPeriodo - 1);
      fin = hoy > finEstimado ? hoy : finEstimado;
    }
    
    let actual = new Date(inicio);
    while (actual <= fin) {
      const strActual = formatDate(actual);
      if (actual > hoy) {
        mapa[strActual] = 'periodo_predicho';
      } else {
        mapa[strActual] = 'periodo_real';
      }
      actual = addDays(actual, 1);
    }
  });

  // 2. Calcular las ovulaciones PASADAS reales
  for (let i = 1; i < ciclosOrdenados.length; i++) {
    const inicioSiguiente = parseDate(ciclosOrdenados[i].fecha_inicio);
    const ovulacionPasada = addDays(inicioSiguiente, -14);
    const strOvulacion = formatDate(ovulacionPasada);
    
    if (!mapa[strOvulacion]) {
      mapa[strOvulacion] = 'ovulacion';
    }
  }

  // 3. Encadenar predicciones desde el ciclo más reciente
  const cicloMasReciente = ciclosOrdenados[ciclosOrdenados.length - 1];
  let fechaInicioPrediccion = parseDate(cicloMasReciente.fecha_inicio);
  const fechaLimite = new Date(añoLimite, 11, 31);

  while (fechaInicioPrediccion <= fechaLimite) {
    const siguienteInicio = addDays(fechaInicioPrediccion, mediaCiclo);
    const ovulacion = addDays(siguienteInicio, -14);
    
    // CORRECCIÓN APLICADA: Pintamos todas las ovulaciones predichas sin restricción de tiempo
    const strOvulacion = formatDate(ovulacion);
    if (!mapa[strOvulacion]) {
      mapa[strOvulacion] = 'ovulacion';
    }

    if (siguienteInicio > parseDate(cicloMasReciente.fecha_inicio) && siguienteInicio <= fechaLimite) {
      for (let i = 0; i < mediaPeriodo; i++) {
        const diaPredicho = addDays(siguienteInicio, i);
        const strDia = formatDate(diaPredicho);
        if (!mapa[strDia]) {
          mapa[strDia] = 'periodo_predicho';
        }
      }
    }
    fechaInicioPrediccion = siguienteInicio;
  }

  return mapa;
};