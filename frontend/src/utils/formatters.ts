export const getFechaFormateada = () => {
  const hoy = new Date();
  const diaSemana = hoy.toLocaleDateString('es-ES', { weekday: 'long' });
  const fechaCompleta = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { diaSemana, fechaCompleta };
};

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