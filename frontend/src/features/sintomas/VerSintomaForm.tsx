import React, { useState } from 'react';
import { Activity, Calendar, FileText, AlertCircle, MapPin, Hash, Zap, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { OcurrenciaSintoma } from './SintomasTabla';
import { formatearFecha } from '../../utils/formatters';
import { CATALOGO_ANATOMIA } from '../../utils/anatomia';
import { getSintomaValor } from '../timeline/TimelineScroll';

interface VerSintomaFormProps {
  sintoma: OcurrenciaSintoma;
  onClose: () => void;
}

export const VerSintomaForm: React.FC<VerSintomaFormProps> = ({ sintoma, onClose }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col space-y-6">
      {/* Cabecera */}
      <div className="flex items-center space-x-4 mb-2 pb-4 border-b border-teal-100">
        <div className="p-3 bg-teal-100 rounded-xl text-teal-700 shadow-sm">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-teal-900 tracking-tight">{sintoma.sintoma_nombre}</h2>
          <p className="text-sm font-semibold text-teal-600/80 uppercase tracking-wider">Ficha de Síntoma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Fecha de Inicio */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-slate-400" />
            Fecha de Inicio
          </span>
          <span className="text-slate-800 font-bold text-lg block mt-1">
            {formatearFecha(sintoma.fecha_inicio)}
          </span>
        </div>

        {/* Intensidad / Valor */}
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center">
            <Hash className="h-4 w-4 mr-1 text-teal-500" />
            Intensidad / Valor
          </span>
          <span className="text-teal-900 font-black text-2xl block mt-1">
            {getSintomaValor(sintoma)}
          </span>
        </div>

        {/* Localizaciones */}
        {sintoma.localizaciones && sintoma.localizaciones.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-slate-400" />
              Localizaciones
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {sintoma.localizaciones.map((loc, index) => {
                const node = CATALOGO_ANATOMIA.find((n) => n.id === loc.localizacion_id);
                const name = node ? node.nombre : loc.localizacion_id;
                const label = `${name}${loc.lado ? ` (${loc.lado})` : ''}`;
                
                return (
                  <span
                    key={index}
                    className={`px-2.5 py-1 text-sm font-semibold rounded-lg border shadow-sm ${
                      loc.es_irradiado
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    {label} {loc.es_irradiado && '(Irradiado)'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Característica */}
        {sintoma.caracteristica && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-1 text-slate-400" />
              Característica
            </span>
            <span className="text-slate-800 font-bold text-base block mt-1">
              {sintoma.caracteristica}
            </span>
          </div>
        )}

        {/* Frecuencia */}
        {sintoma.frecuencia && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 text-slate-400" />
              Frecuencia
            </span>
            <span className="text-slate-800 font-bold text-base block mt-1">
              {sintoma.frecuencia}
            </span>
          </div>
        )}

        {/* Modificadores */}
        {sintoma.modificadores && sintoma.modificadores.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Activity className="h-4 w-4 mr-1 text-slate-400" />
                Modificadores
              </span>
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setShowInfo(!showInfo)}
                  className="text-slate-400 hover:text-teal-600 focus:outline-none"
                  title="Información sobre modificadores"
                >
                  <Info className="h-4 w-4" />
                </button>
                {showInfo && (
                  <div className="absolute right-0 top-6 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                    Los modificadores en <span className="text-emerald-400 font-bold">verde</span> indican que el síntoma mejora o se alivia. En <span className="text-red-400 font-bold">rojo</span> indican que empeora.
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {sintoma.modificadores.map((mod, i) => {
                const isMejora = mod.efecto.toLowerCase().includes('mejora') || mod.efecto.toLowerCase().includes('alivia');
                const isEmpeora = mod.efecto.toLowerCase().includes('empeora') || mod.efecto.toLowerCase().includes('agrava');
                
                let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isMejora) colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                if (isEmpeora) colorClasses = 'bg-red-100 text-red-800 border-red-200';

                return (
                  <span key={i} className={`px-2.5 py-1 text-sm font-semibold rounded-lg border shadow-sm ${colorClasses}`}>
                    {mod.factor}: {mod.efecto}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Notas */}
        {sintoma.notas && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-1 text-slate-400" />
              Notas
            </span>
            <p className="text-slate-700 font-medium bg-white p-3 rounded-lg border border-slate-200 mt-2 whitespace-pre-wrap text-sm">
              {sintoma.notas}
            </p>
          </div>
        )}

      </div>

      <div className="pt-4 border-t border-teal-100 flex justify-end">
        <Button 
          type="button" 
          onClick={onClose}
          colorTheme={{
            bgNormal: 'bg-teal-700',
            bgHover: 'bg-teal-800',
            textColor: 'text-white',
            focusRing: 'bg-teal-800',
          }}
        >
          Salir
        </Button>
      </div>
    </div>
  );
};
