export interface PesoDB {
  id: string | number;
  peso: number;
  fecha: string;
  en_ayunas: boolean;
  promedio?: number;
}

// IMC = Peso(kg) / Altura(m)^2
export const calcularIMC = (peso: number, alturaCm: number): number => {
  const alturaM = alturaCm / 100;
  return Number((peso / (alturaM * alturaM)).toFixed(1));
};

// Peso = IMC * Altura(m)^2
export const calcularPesoParaIMC = (imc: number, alturaCm: number): number => {
  const alturaM = alturaCm / 100;
  return Number((imc * (alturaM * alturaM)).toFixed(1));
};

// NUEVO: Añadida la descripción para los Tooltips del Widget
export const obtenerColorIMC = (imc: number) => {
  if (imc < 18.5) return { 
    texto: 'Infrapeso', 
    clases: 'text-blue-700 bg-blue-50 border-blue-200',
    descripcion: 'Tu peso es inferior al nivel saludable. Puede indicar falta de nutrientes o un déficit calórico excesivo.'
  };
  if (imc < 25) return { 
    texto: 'Normal', 
    clases: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    descripcion: 'Estás en el rango de peso ideal. Esto indica un menor riesgo de enfermedades cardiovasculares y metabólicas.'
  };
  if (imc < 30) return { 
    texto: 'Sobrepeso', 
    clases: 'text-orange-700 bg-orange-50 border-orange-200',
    descripcion: 'Peso por encima de lo recomendado. Aumenta ligeramente el riesgo de problemas de salud a largo plazo si no se controla.'
  };
  return { 
    texto: 'Obesidad', 
    clases: 'text-red-700 bg-red-50 border-red-200',
    descripcion: 'Exceso de masa corporal significativo. Aumenta considerablemente el riesgo de diabetes, hipertensión y problemas cardíacos.'
  };
};