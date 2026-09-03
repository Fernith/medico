export interface MedicionDB {
  id: string | number;
  fecha: string;
  cm_cintura: number | null;
  cm_cadera: number | null;
}

export const calcularICC = (cintura: number, cadera: number): number => {
  return Number((cintura / cadera).toFixed(2));
};

export const calcularICE = (cintura: number, altura: number): number => {
  return Number((cintura / altura).toFixed(2));
};

export const evaluarRiesgoICC = (icc: number, sexo: 'Masculino' | 'Femenino') => {
  const limite = sexo === 'Masculino' ? 0.90 : 0.85;
  if (icc >= limite) return { 
    texto: 'Riesgo Alto', 
    clases: 'text-rose-700 bg-rose-50 border-rose-200',
    descripcion: 'Acumulación de grasa abdominal central ("forma de manzana"). Aumenta el riesgo de complicaciones cardiovasculares y metabólicas.'
  };
  return { 
    texto: 'Normal', 
    clases: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    descripcion: 'Distribución de grasa saludable. Indica un menor riesgo de desarrollar enfermedades asociadas a la obesidad.'
  };
};

export const evaluarRiesgoICE = (ice: number) => {
  if (ice >= 0.50) return { 
    texto: 'Riesgo Alto', 
    clases: 'text-rose-700 bg-rose-50 border-rose-200',
    descripcion: 'La circunferencia de tu cintura supera la mitad de tu estatura. Riesgo metabólico elevado.'
  };
  return { 
    texto: 'Normal', 
    clases: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    descripcion: 'Proporción saludable. Tu cintura se mantiene de forma correcta por debajo de la mitad de tu estatura.'
  };
};