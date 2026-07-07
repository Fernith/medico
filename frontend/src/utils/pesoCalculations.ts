export interface PesoDB {
  id: string | number;
  peso: number;
  fecha: string; // YYYY-MM-DD
  en_ayunas: boolean;
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

export const obtenerColorIMC = (imc: number) => {
  if (imc < 18.5) return { texto: 'Infrapeso', clases: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (imc < 25) return { texto: 'Normal', clases: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (imc < 30) return { texto: 'Sobrepeso', clases: 'text-orange-700 bg-orange-50 border-orange-200' };
  return { texto: 'Obesidad', clases: 'text-red-700 bg-red-50 border-red-200' };
};