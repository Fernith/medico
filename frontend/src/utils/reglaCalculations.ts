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

  // Calculamos "hoy" a las 00:00:00 local para comparaciones exactas
  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Helper para crear fechas seguras sin desfase UTC
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

  // NUEVO: Ordenamos los ciclos cronológicamente (del más antiguo al más reciente)
  // Esto es crucial para poder calcular "14 días antes del siguiente"
  const ciclosOrdenados = [...ciclos].sort((a, b) => 
    parseDate(a.fecha_inicio).getTime() - parseDate(b.fecha_inicio).getTime()
  );

  // 1. Registrar los periodos reales (y sus días futuros si está en curso)
  ciclosOrdenados.forEach(ciclo => {
    const inicio = parseDate(ciclo.fecha_inicio);
    
    let fin: Date;
    if (ciclo.fecha_fin) {
      fin = parseDate(ciclo.fecha_fin);
    } else {
      const finEstimado = addDays(inicio, mediaPeriodo - 1);
      // Si el ciclo sigue en curso, extendemos el final hasta HOY (si ya superó la media)
      // o mantenemos la predicción de la media (si el periodo acaba de empezar).
      fin = hoy > finEstimado ? hoy : finEstimado;
    }
    
    let actual = new Date(inicio);
    while (actual <= fin) {
      const strActual = formatDate(actual);
      
      // Si el día del ciclo está en el futuro, lo pintamos como predicho aunque esté en curso
      if (actual > hoy) {
        mapa[strActual] = 'periodo_predicho';
      } else {
        mapa[strActual] = 'periodo_real';
      }
      
      actual = addDays(actual, 1);
    }
  });

  // 2. NUEVO: Calcular las ovulaciones PASADAS reales
  // Empezamos desde el índice 1 porque restamos 14 días al inicio de cada ciclo
  for (let i = 1; i < ciclosOrdenados.length; i++) {
    const inicioSiguiente = parseDate(ciclosOrdenados[i].fecha_inicio);
    const ovulacionPasada = addDays(inicioSiguiente, -14);
    const strOvulacion = formatDate(ovulacionPasada);
    
    // Evitamos sobreescribir un día de periodo por seguridad
    if (!mapa[strOvulacion]) {
      mapa[strOvulacion] = 'ovulacion';
    }
  }

  // 3. Encadenar predicciones desde el ciclo más reciente
  // Al estar ordenados, el último del array es el más reciente
  const cicloMasReciente = ciclosOrdenados[ciclosOrdenados.length - 1];
  let fechaInicioPrediccion = parseDate(cicloMasReciente.fecha_inicio);
  const fechaLimite = new Date(añoLimite, 11, 31);
  let ovulacionEncontrada = false;

  while (fechaInicioPrediccion <= fechaLimite) {
    const siguienteInicio = addDays(fechaInicioPrediccion, mediaCiclo);
    const ovulacion = addDays(siguienteInicio, -14);
    
    // Solo marcamos una única ovulación: la primera que sea hoy o en el futuro
    if (!ovulacionEncontrada && ovulacion >= hoy) {
      const strOvulacion = formatDate(ovulacion);
      if (!mapa[strOvulacion]) {
        mapa[strOvulacion] = 'ovulacion';
      }
      ovulacionEncontrada = true;
    }

    if (siguienteInicio > parseDate(cicloMasReciente.fecha_inicio) && siguienteInicio <= fechaLimite) {
      for (let i = 0; i < mediaPeriodo; i++) {
        const diaPredicho = addDays(siguienteInicio, i);
        const strDia = formatDate(diaPredicho);
        // Protegemos para no sobreescribir datos reales
        if (!mapa[strDia]) {
          mapa[strDia] = 'periodo_predicho';
        }
      }
    }
    fechaInicioPrediccion = siguienteInicio;
  }

  return mapa;
};