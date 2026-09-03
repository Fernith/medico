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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* TARJETA ICE */}
      <div className={`p-6 rounded-2xl border flex flex-col ${infoICE.clases}`}>
        <div className="flex-1 mb-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Índice Cintura-Estatura</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black">{ice}</p>
            <p className="text-lg font-bold">{infoICE.texto}</p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-current/20 flex flex-col gap-3 mt-auto">
          <div>
            <p className="font-black uppercase tracking-wider text-[10px] opacity-60 mb-0.5">¿Qué mide el ICE?</p>
            <p className="text-xs font-medium opacity-90 leading-relaxed">
              Evalúa la proporción de grasa abdominal respecto a tu altura. El objetivo cardiosaludable es que tu cintura mida menos de la mitad de tu altura (valor menor a 0.50).
            </p>
          </div>
          <div>
            <p className="font-black uppercase tracking-wider text-[10px] opacity-60 mb-0.5">Tu Valoración:</p>
            <p className="text-xs font-bold opacity-95 leading-relaxed">
              {infoICE.descripcion}
            </p>
          </div>
        </div>
      </div>

      {/* TARJETA ICC */}
      {icc && infoICC ? (
        <div className={`p-6 rounded-2xl border flex flex-col ${infoICC.clases}`}>
          <div className="flex-1 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Índice Cintura-Cadera</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-black">{icc}</p>
              <p className="text-lg font-bold">{infoICC.texto}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-current/20 flex flex-col gap-3 mt-auto">
            <div>
              <p className="font-black uppercase tracking-wider text-[10px] opacity-60 mb-0.5">¿Qué mide el ICC?</p>
              <p className="text-xs font-medium opacity-90 leading-relaxed">
                Indica cómo se distribuye la grasa en tu cuerpo. Acumular grasa en el abdomen ("forma de manzana") supone mayor riesgo metabólico que hacerlo en las caderas ("forma de pera").
              </p>
            </div>
            <div>
              <p className="font-black uppercase tracking-wider text-[10px] opacity-60 mb-0.5">Tu Valoración:</p>
              <p className="text-xs font-bold opacity-95 leading-relaxed">
                {infoICC.descripcion}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border bg-slate-50 border-slate-200 flex flex-col justify-center items-center text-center text-slate-500 text-sm gap-2">
          <span className="text-2xl">📏</span>
          <p className="font-medium">Añade la medida de tu cadera para calcular el Índice Cintura-Cadera (ICC) y ver su valoración médica.</p>
        </div>
      )}
    </div>
  );
};