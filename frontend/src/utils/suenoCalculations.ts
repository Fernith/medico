export interface SuenoDB {
  fecha: string;
  minutos_sueno: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  minutos_ligero: number;
  minutos_profundo: number;
  minutos_rem: number;
  minutos_despierto: number;
  minutos_siesta: number;
  siesta_hora_inicio: string | null;
  siesta_hora_fin: string | null;
}

// Formateador exacto como pediste: "X h XX m"
export const formatMinutos = (mins: number | null | undefined): string => {
  if (mins == null || isNaN(mins)) return '0 m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} m`;
  return `${h} h ${m.toString().padStart(2, '0')} m`;
};

// Conversor de la "Medianoche Desplazada"
export const getChartY = (dateString: string | null): number | null => {
  if (!dateString) return null;
  const d = new Date(dateString);
  const hours = d.getHours() + d.getMinutes() / 60;
  
  // Escala de 14:00 a 14:00 del día siguiente (Rango 14 a 38)
  // Si la hora es menor a las 14:00, asumimos que pertenece a la mañana/madrugada de "ese" ciclo de sueño
  if (hours < 14) return hours + 24;
  return hours;
};