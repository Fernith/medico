import { useState, useEffect, useMemo } from 'react';

export interface EstadisticaSerieRow {
  historial_rutina_id: string;
  rutina_nombre: string;
  fecha_inicio: string;
  ejercicio_id: string;
  ejercicio_nombre: string;
  tipo_entrenamiento_nombre: string | null;
  grupos_musculares: string[];
  serie_numero: number;
  reps_completadas: number | null;
  carga_completada: number | null;
  unidad_carga: string | null;
}

export const useEstadisticas = () => {
  const [data, setData] = useState<EstadisticaSerieRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pieDays, setPieDays] = useState<number>(35); // Selector dinámico (por defecto 35)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/estadisticas/historial');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Error al cargar estadísticas", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. DATOS PARA PIE CHARTS (Con filtro de días móvil)
  const pieChartsData = useMemo(() => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - pieDays);

    const filteredSeries = data.filter(d => new Date(d.fecha_inicio) >= limitDate);

    // Agrupar Tipos
    const tiposMap: Record<string, number> = {};
    // Agrupar Músculos (Sumamos +1 por cada músculo implicado en cada serie)
    const musculosMap: Record<string, number> = {};

    filteredSeries.forEach(s => {
      const tipo = s.tipo_entrenamiento_nombre || 'Sin clasificar';
      tiposMap[tipo] = (tiposMap[tipo] || 0) + 1;

      if (s.grupos_musculares.length === 0) {
        musculosMap['Sin clasificar'] = (musculosMap['Sin clasificar'] || 0) + 1;
      } else {
        s.grupos_musculares.forEach(m => {
          musculosMap[m] = (musculosMap[m] || 0) + 1;
        });
      }
    });

    const formatData = (map: Record<string, number>) => 
      Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      tipos: formatData(tiposMap),
      musculos: formatData(musculosMap)
    };
  }, [data, pieDays]);

  // 2. SESIONES ÚNICAS (Para gráficas de Mes y Días de la semana)
  const sesionesUnicas = useMemo(() => {
    const map = new Map<string, EstadisticaSerieRow>();
    data.forEach(d => { if (!map.has(d.historial_rutina_id)) map.set(d.historial_rutina_id, d); });
    return Array.from(map.values());
  }, [data]);

  // 3. ENTRENOS POR MES (Bar Chart)
  const entrenosPorMes = useMemo(() => {
    const meses: Record<string, number> = {};
    sesionesUnicas.forEach(s => {
      const date = new Date(s.fecha_inicio);
      const label = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }).format(date);
      meses[label] = (meses[label] || 0) + 1;
    });
    // Respetar el orden cronológico original de la BBDD
    return Object.entries(meses).map(([name, Entrenos]) => ({ name, Entrenos })).reverse();
  }, [sesionesUnicas]);

  // 4. DÍAS DE LA SEMANA (Filtro cerrado a 35 días)
  const diasSemanaStats = useMemo(() => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 35);
    
    const recientes = sesionesUnicas.filter(s => new Date(s.fecha_inicio) >= limitDate);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const conteo = [0, 0, 0, 0, 0, 0, 0];

    recientes.forEach(s => {
      conteo[new Date(s.fecha_inicio).getDay()]++;
    });

    let maxDia = 'Ninguno'; let maxVal = -1;
    let minDia = 'Ninguno'; let minVal = 9999;

    conteo.forEach((val, idx) => {
      if (val > maxVal) { maxVal = val; maxDia = dias[idx]; }
      if (val < minVal) { minVal = val; minDia = dias[idx]; }
    });

    return { 
      maxDia: maxVal === 0 ? '-' : maxDia, maxVal, 
      minDia: maxVal === 0 ? '-' : minDia, minVal 
    };
  }, [sesionesUnicas]);

  // 5. PROGRESIÓN POR EJERCICIO (Tabla Option A)
  const progresionEjercicios = useMemo(() => {
    // Agrupamos filas por Ejercicio ID
    const porEjercicio: Record<string, EstadisticaSerieRow[]> = {};
    data.forEach(d => {
      if (!porEjercicio[d.ejercicio_id]) porEjercicio[d.ejercicio_id] = [];
      porEjercicio[d.ejercicio_id].push(d);
    });

    const resultados = Object.values(porEjercicio).map(seriesEjercicio => {
      // 1. Agrupar por sesión
      const porSesion: Record<string, EstadisticaSerieRow[]> = {};
      seriesEjercicio.forEach(s => {
        if (!porSesion[s.historial_rutina_id]) porSesion[s.historial_rutina_id] = [];
        porSesion[s.historial_rutina_id].push(s);
      });

      // 2. Ordenar sesiones por fecha descendente
      const sesionesOrdenadas = Object.values(porSesion).sort((a, b) => 
        new Date(b[0].fecha_inicio).getTime() - new Date(a[0].fecha_inicio).getTime()
      );

      const calcularMetricas = (sesion: EstadisticaSerieRow[]) => {
        let maxPeso = 0;
        let totalReps = 0;
        let volumenTotal = 0;
        sesion.forEach(s => {
          const peso = s.carga_completada || 0;
          const reps = s.reps_completadas || 0;
          if (peso > maxPeso) maxPeso = peso;
          totalReps += reps;
          volumenTotal += (peso * reps);
        });
        return { maxPeso, totalReps, volumenTotal, fecha: sesion[0].fecha_inicio, unidad: sesion[0].unidad_carga || 'kg' };
      };

      const last = sesionesOrdenadas[0] ? calcularMetricas(sesionesOrdenadas[0]) : null;
      const prev = sesionesOrdenadas[1] ? calcularMetricas(sesionesOrdenadas[1]) : null;

      return {
        ejercicio_nombre: seriesEjercicio[0].ejercicio_nombre,
        last,
        prev
      };
    });

    return resultados.sort((a, b) => a.ejercicio_nombre.localeCompare(b.ejercicio_nombre));
  }, [data]);

  return { isLoading, pieDays, setPieDays, pieChartsData, entrenosPorMes, diasSemanaStats, progresionEjercicios };
};