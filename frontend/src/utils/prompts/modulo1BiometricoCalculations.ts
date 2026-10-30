import { apiFetch } from '../../api/client';
import { calcularIMC, type PesoDB } from '../pesoCalculations';
import { calcularEdad, type UsuarioInfo } from '../promptCalculations';
import { formatearModulo1Biometrico } from '../../features/usuario/prompts/promptModularTemplate';

/**
 * Compila y formatea el Módulo 1: Perfil Biométrico y Ocupacional.
 * Reutiliza calcularEdad y calcularIMC de pesoCalculations (redondeado a 2 decimales).
 */
export const compilarModulo1Biometrico = async (): Promise<string> => {
  try {
    const [resUsuario, resPesos] = await Promise.allSettled([
      apiFetch('/api/usuario').then((r) => r.json() as Promise<UsuarioInfo>),
      apiFetch('/api/pesos').then((r) => r.json() as Promise<PesoDB[]>),
    ]);

    let sexo = '--';
    let edad: number | string = '--';
    let alturaCm: number | string = '--';
    let imc: string = '--';
    let ocupacion = 'No especificada';

    let alturaCmNum: number | null = null;

    if (resUsuario.status === 'fulfilled' && resUsuario.value) {
      const u = resUsuario.value;
      if (u.sexo) {
        const s = u.sexo.trim().toLowerCase();
        if (s.startsWith('fem') || s === 'f') {
          sexo = 'F';
        } else if (s.startsWith('masc') || s === 'm') {
          sexo = 'M';
        } else {
          sexo = u.sexo.toUpperCase();
        }
      }

      if (u.nacimiento) {
        const edadCalc = calcularEdad(u.nacimiento);
        if (edadCalc !== null) {
          edad = edadCalc;
        }
      }

      if (u.altura) {
        const alt = parseFloat(u.altura);
        if (!isNaN(alt) && alt > 0) {
          alturaCm = Math.round(alt);
          alturaCmNum = alt;
        }
      }

      if (u.ocupacion && u.ocupacion.trim()) {
        ocupacion = u.ocupacion.trim();
      }
    }

    if (
      resPesos.status === 'fulfilled' &&
      Array.isArray(resPesos.value) &&
      resPesos.value.length > 0 &&
      alturaCmNum &&
      alturaCmNum > 0
    ) {
      const pesosOrdenados = [...resPesos.value].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      const ultimoPeso = pesosOrdenados[0];
      if (ultimoPeso && ultimoPeso.peso > 0) {
        const imcNum = calcularIMC(ultimoPeso.peso, alturaCmNum);
        imc = imcNum.toFixed(2);
      }
    }

    return formatearModulo1Biometrico({
      sexo,
      edad,
      alturaCm,
      imc,
      ocupacion,
    });
  } catch (error) {
    console.error('Error al compilar el Módulo 1 biométrico:', error);
    return formatearModulo1Biometrico({
      sexo: '--',
      edad: '--',
      alturaCm: '--',
      imc: '--',
      ocupacion: 'No especificada',
    });
  }
};

