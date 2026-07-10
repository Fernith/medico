import React from 'react';
import { calcularICC, calcularICE, evaluarRiesgoICC, evaluarRiesgoICE } from '../../utils/medicionCalculations';

interface MedidasIndicadoresWidgetProps {
  cintura: number | null;
  cadera: number | null;
  altura: number;
  sexo: 'Masculino' | 'Femenino';
}

export const MedidasIndicadoresWidget: React.FC<MedidasIndicadoresWidgetProps> = ({ cintura, cadera, altura, sexo }) => {
  if (!cintura) {
    return (
      <div className="p-6 rounded-2xl border bg-slate-50 border-slate-200 flex justify-center items-center text-slate-500 font-medium">
        Faltan datos de medidas para calcular los indicadores.
      </div>
    );
  }

  const ice = calcularICE(cintura, altura);
  const infoICE = evaluarRiesgoICE(ice);

  let icc = null;
  let infoICC = null;
  
  if (cadera) {
    icc = calcularICC(cintura, cadera);
    infoICC = evaluarRiesgoICC(icc, sexo);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* TARJETA ICE */}
      <div className={`p-6 rounded-2xl border ${infoICE.clases}`}>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Índice Cintura-Estatura</p>
        <div className="flex items-end justify-between mt-2">
          <p className="text-3xl font-black">{ice}</p>
          <p className="text-lg font-bold">{infoICE.texto}</p>
        </div>
      </div>

      {/* TARJETA ICC */}
      {icc && infoICC ? (
        <div className={`p-6 rounded-2xl border ${infoICC.clases}`}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Índice Cintura-Cadera</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black">{icc}</p>
            <p className="text-lg font-bold">{infoICC.texto}</p>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border bg-slate-50 border-slate-200 flex items-center text-slate-500 text-sm">
          Añade la cadera para ver el ICC
        </div>
      )}
    </div>
  );
};