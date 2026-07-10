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
  if (icc >= limite) return { texto: 'Riesgo Alto', clases: 'text-rose-700 bg-rose-100 border-rose-200' };
  return { texto: 'Normal', clases: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
};

export const evaluarRiesgoICE = (ice: number) => {
  if (ice >= 0.50) return { texto: 'Riesgo Alto', clases: 'text-rose-700 bg-rose-100 border-rose-200' };
  return { texto: 'Normal', clases: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
};