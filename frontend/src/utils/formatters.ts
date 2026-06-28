export const getFechaFormateada = () => {
  const hoy = new Date();
  const diaSemana = hoy.toLocaleDateString('es-ES', { weekday: 'long' });
  const fechaCompleta = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { diaSemana, fechaCompleta };
};

// 8h = 100%, +/- 1h = -20%
export const calcularPorcentajeSueno = (horas: number) => {
  const diferencia = Math.abs(8 - horas);
  const porcentaje = 100 - (diferencia * 20);
  return Math.max(0, Math.min(100, porcentaje)); 
};

export const formatearHoras = (horasDecimales: number) => {
  const horas = Math.floor(horasDecimales);
  const minutos = Math.round((horasDecimales % 1) * 60);
  return `${horas} h ${minutos} min`;
};