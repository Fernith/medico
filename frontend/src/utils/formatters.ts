// Convierte minutos totales (ej: 464) a formato humano "7 h 44 min"
export const formatearMinutos = (minutosTotales: number) => {
  const horas = Math.floor(minutosTotales / 60);
  const minutos = Math.round(minutosTotales % 60);
  return `${horas} h ${minutos} min`;
};

// 8h = 480 min (100%). Cada 60 min de diferencia resta 20%
export const calcularPorcentajeSuenoMinutos = (minutos: number) => {
  const diferencia = Math.abs(480 - minutos);
  const porcentaje = 100 - ((diferencia / 60) * 20);
  return Math.max(0, Math.min(100, porcentaje)); 
};

// Analiza una fecha y devuelve si es hoy o el texto amigable (ej: "el 28 jun")
export const formatearFechaRelativa = (fechaStr?: string | null) => {
  if (!fechaStr) return { esHoy: true, sufijo: 'hoy' };

  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  const hoyIso = `${year}-${month}-${day}`;

  if (fechaStr === hoyIso) {
    return { esHoy: true, sufijo: 'hoy' };
  }

  const [y, m, d] = fechaStr.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  return {
    esHoy: false,
    sufijo: `el ${dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
  };
};