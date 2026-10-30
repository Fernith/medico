import { apiFetch } from '../../api/client';
import { type PesoDB } from '../pesoCalculations';
import { calcularICE, calcularICC, type MedicionDB } from '../medicionCalculations';
import { type UsuarioInfo } from '../promptCalculations';
import { formatearModulo2ComposicionCorporal } from '../../features/usuario/prompts/promptModularTemplate';

/**
 * Compila y formatea el Módulo 2: Composición Corporal y Tendencias Metabólicas.
 * Reutiliza calcularICE y calcularICC de medicionCalculations.
 */
export const compilarModulo2ComposicionCorporal = async (): Promise<string> => {
  try {
    const [resPesos, resMediciones, resUsuario] = await Promise.allSettled([
      apiFetch('/api/pesos').then((r) => r.json() as Promise<PesoDB[]>),
      apiFetch('/api/mediciones').then((r) => r.json() as Promise<MedicionDB[]>),
      apiFetch('/api/usuario').then((r) => r.json() as Promise<UsuarioInfo>),
    ]);

    const pesos: PesoDB[] =
      resPesos.status === 'fulfilled' && Array.isArray(resPesos.value)
        ? resPesos.value
        : [];

    const mediciones: MedicionDB[] =
      resMediciones.status === 'fulfilled' && Array.isArray(resMediciones.value)
        ? resMediciones.value
        : [];

    let alturaCmNum: number | null = null;
    if (resUsuario.status === 'fulfilled' && resUsuario.value?.altura) {
      const alt = parseFloat(resUsuario.value.altura);
      if (!isNaN(alt) && alt > 0) alturaCmNum = alt;
    }

    // 1. PESO_ACTUAL_KG (último pesaje en ayunas, fallback a último en general)
    const pesajesDesc = [...pesos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    let pesoActualNum: number | null = null;
    const ultimoAyunas = pesajesDesc.find((p) => p.en_ayunas && p.peso > 0);
    if (ultimoAyunas) {
      pesoActualNum = ultimoAyunas.peso;
    } else if (pesajesDesc.length > 0 && pesajesDesc[0].peso > 0) {
      pesoActualNum = pesajesDesc[0].peso;
    }

    const pesoActualKg = pesoActualNum !== null ? pesoActualNum.toFixed(1) : '--';

    // 2. GRASA_ACTUAL_PCT
    let grasaActualNum: number | null = null;
    const ultimoGrasa = pesajesDesc.find(
      (p) => p.grasa_corporal !== null && p.grasa_corporal !== undefined && p.grasa_corporal > 0
    );
    if (ultimoGrasa && ultimoGrasa.grasa_corporal !== null && ultimoGrasa.grasa_corporal !== undefined) {
      grasaActualNum = ultimoGrasa.grasa_corporal;
    }

    const grasaActualPct = grasaActualNum !== null ? grasaActualNum.toFixed(1) : '--';

    // 3. MASA MAGRA Y GRASA ESTIMADAS
    let masaMagraKg = '--';
    let masaGrasaKg = '--';
    if (pesoActualNum !== null && grasaActualNum !== null) {
      const mg = pesoActualNum * (grasaActualNum / 100);
      const mm = pesoActualNum * (1 - grasaActualNum / 100);
      masaMagraKg = mm.toFixed(1);
      masaGrasaKg = mg.toFixed(1);
    }

    // Fecha base para cálculos temporales (usar fecha del último pesaje o fecha actual)
    const fechaRef =
      pesajesDesc.length > 0 ? new Date(pesajesDesc[0].fecha) : new Date();

    // 4. DINÁMICA 30 DÍAS
    const hace30d = new Date(fechaRef.getTime() - 30 * 24 * 3600 * 1000);
    const pesajes30d = pesajesDesc.filter(
      (p) => new Date(p.fecha).getTime() >= hace30d.getTime() && p.peso > 0
    );

    let pesoMedia30dKg = '--';
    let pesoMin30dKg = '--';
    let pesoMax30dKg = '--';
    let rangoOscilacionPeso30d = '--';

    if (pesajes30d.length > 0) {
      const valores = pesajes30d.map((p) => p.peso);
      const suma = valores.reduce((acc, val) => acc + val, 0);
      const media = suma / valores.length;
      const min = Math.min(...valores);
      const max = Math.max(...valores);

      pesoMedia30dKg = media.toFixed(1);
      pesoMin30dKg = min.toFixed(1);
      pesoMax30dKg = max.toFixed(1);
      rangoOscilacionPeso30d = (max - min).toFixed(1);
    }

    // 5. VARIACIÓN AGUDA (ÚLTIMOS 7 DÍAS): Media(últimos 3 días) - Media(días -7 a -5)
    let deltaPeso7dKg = '--';
    const hace2d = new Date(fechaRef.getTime() - 2 * 24 * 3600 * 1000);
    const hace5d = new Date(fechaRef.getTime() - 5 * 24 * 3600 * 1000);
    const hace7d = new Date(fechaRef.getTime() - 7 * 24 * 3600 * 1000);

    const pesajesUltimos3d = pesajesDesc.filter(
      (p) => new Date(p.fecha).getTime() >= hace2d.getTime() && p.peso > 0
    );
    const pesajesPrevios5a7d = pesajesDesc.filter(
      (p) =>
        new Date(p.fecha).getTime() >= hace7d.getTime() &&
        new Date(p.fecha).getTime() <= hace5d.getTime() + 24 * 3600 * 1000 &&
        p.peso > 0
    );

    if (pesajesUltimos3d.length > 0 && pesajesPrevios5a7d.length > 0) {
      const mediaReciente =
        pesajesUltimos3d.reduce((acc, p) => acc + p.peso, 0) / pesajesUltimos3d.length;
      const mediaPrevia =
        pesajesPrevios5a7d.reduce((acc, p) => acc + p.peso, 0) / pesajesPrevios5a7d.length;
      const delta = mediaReciente - mediaPrevia;
      deltaPeso7dKg = (delta >= 0 ? '+' : '') + delta.toFixed(1);
    } else if (pesajesDesc.length >= 2) {
      // Fallback si no hay pesajes exactamente en la ventana de 5 a 7 días:
      const pesajes7d = pesajesDesc.filter(
        (p) => new Date(p.fecha).getTime() >= hace7d.getTime() && p.peso > 0
      );
      if (pesajes7d.length >= 2) {
        const masReciente = pesajes7d[0].peso;
        const masAntiguo = pesajes7d[pesajes7d.length - 1].peso;
        const delta = masReciente - masAntiguo;
        deltaPeso7dKg = (delta >= 0 ? '+' : '') + delta.toFixed(1);
      }
    }

    // 6. TENDENCIA LONGITUDINAL (90 DÍAS): Pendiente (kg/mes) y R²
    const hace90d = new Date(fechaRef.getTime() - 90 * 24 * 3600 * 1000);
    const pesajes90dAsc = [...pesos]
      .filter((p) => new Date(p.fecha).getTime() >= hace90d.getTime() && p.peso > 0)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let pendientePeso90dKgMes = '--';
    let pesoR2_90d: number | string = '--';

    if (pesajes90dAsc.length >= 2) {
      const t0 = new Date(pesajes90dAsc[0].fecha).getTime();
      const puntos = pesajes90dAsc.map((p) => ({
        x: (new Date(p.fecha).getTime() - t0) / (24 * 3600 * 1000), // días
        y: p.peso,
      }));

      const N = puntos.length;
      const sumX = puntos.reduce((acc, p) => acc + p.x, 0);
      const sumY = puntos.reduce((acc, p) => acc + p.y, 0);
      const meanX = sumX / N;
      const meanY = sumY / N;

      let ssXX = 0;
      let ssYY = 0;
      let ssXY = 0;

      for (const p of puntos) {
        const dx = p.x - meanX;
        const dy = p.y - meanY;
        ssXX += dx * dx;
        ssYY += dy * dy;
        ssXY += dx * dy;
      }

      if (ssXX > 0.0001) {
        const mDia = ssXY / ssXX;
        const mMes = mDia * 30; // kg por mes
        pendientePeso90dKgMes = (mMes >= 0 ? '+' : '') + mMes.toFixed(2);

        if (ssYY > 0.0001) {
          const r2 = (ssXY * ssXY) / (ssXX * ssYY);
          const r2Clamped = Math.min(1, Math.max(0, r2));
          pesoR2_90d = r2Clamped.toFixed(2);
        } else {
          pesoR2_90d = '0.00';
        }
      }
    }

    // 7. MEDIDAS CORPORALES (Cintura y Cadera)
    const medicionesDesc = [...mediciones].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    let cinturaNum: number | null = null;
    let caderaNum: number | null = null;

    const ultCintura = medicionesDesc.find(
      (m) => m.cm_cintura !== null && m.cm_cintura !== undefined && m.cm_cintura > 0
    );
    if (ultCintura && ultCintura.cm_cintura) {
      cinturaNum = ultCintura.cm_cintura;
    }

    const ultCadera = medicionesDesc.find(
      (m) => m.cm_cadera !== null && m.cm_cadera !== undefined && m.cm_cadera > 0
    );
    if (ultCadera && ultCadera.cm_cadera) {
      caderaNum = ultCadera.cm_cadera;
    }

    const cinturaCm = cinturaNum !== null ? Math.round(cinturaNum) : '--';
    const caderaCm = caderaNum !== null ? Math.round(caderaNum) : '--';

    // 8. ÍNDICES DE RIESGO: ICE e ICC (reutilizando funciones de medicionCalculations)
    let iceValor: number | string = '--';
    let iccValor: number | string = '--';

    if (cinturaNum !== null && alturaCmNum !== null && alturaCmNum > 0) {
      iceValor = calcularICE(cinturaNum, alturaCmNum).toFixed(2);
    }

    if (cinturaNum !== null && caderaNum !== null && caderaNum > 0) {
      iccValor = calcularICC(cinturaNum, caderaNum).toFixed(2);
    }

    return formatearModulo2ComposicionCorporal({
      pesoActualKg,
      grasaActualPct,
      masaMagraKg,
      masaGrasaKg,
      pesoMedia30dKg,
      pesoMin30dKg,
      pesoMax30dKg,
      rangoOscilacionPeso30d,
      deltaPeso7dKg,
      pendientePeso90dKgMes,
      pesoR2_90d,
      cinturaCm,
      caderaCm,
      iceValor,
      iccValor,
    });
  } catch (error) {
    console.error('Error al compilar el Módulo 2 de composición corporal:', error);
    return formatearModulo2ComposicionCorporal({
      pesoActualKg: '--',
      grasaActualPct: '--',
      masaMagraKg: '--',
      masaGrasaKg: '--',
      pesoMedia30dKg: '--',
      pesoMin30dKg: '--',
      pesoMax30dKg: '--',
      rangoOscilacionPeso30d: '--',
      deltaPeso7dKg: '--',
      pendientePeso90dKgMes: '--',
      pesoR2_90d: '--',
      cinturaCm: '--',
      caderaCm: '--',
      iceValor: '--',
      iccValor: '--',
    });
  }
};

