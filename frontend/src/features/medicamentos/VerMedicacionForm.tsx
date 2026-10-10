import React from 'react';
import { Pill, Calendar, Hash, Droplets } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { HistorialMedicacion } from './HistorialMedicacionForm';
import { formatearFecha } from '../../utils/formatters';

interface VerMedicacionFormProps {
  medicacion: HistorialMedicacion;
  onClose: () => void;
}

export const VerMedicacionForm: React.FC<VerMedicacionFormProps> = ({ medicacion, onClose }) => {
  return (
    <div className="flex flex-col space-y-6">
      {/* Cabecera */}
      <div className="flex items-center space-x-4 mb-2 pb-4 border-b border-teal-100">
        <div className="p-3 bg-teal-100 rounded-xl text-teal-700 shadow-sm">
          <Pill className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-teal-900 tracking-tight">{medicacion.medicamento_nombre}</h2>
          <p className="text-sm font-semibold text-teal-600/80 uppercase tracking-wider">Ficha de Toma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Categoría */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
            <Pill className="h-4 w-4 mr-1 text-slate-400" />
            Categoría
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <span 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: medicacion.categoria_color || '#14b8a6' }}
            />
            <span className="text-slate-800 font-bold text-lg">
              {medicacion.categoria_nombre || 'Sin categoría'}
            </span>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-slate-400" />
            Fecha de Toma
          </span>
          <span className="text-slate-800 font-bold text-lg block mt-1">
            {formatearFecha(medicacion.fecha_hora)}
          </span>
        </div>

        {/* Toma (Cantidad) */}
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 sm:col-span-2">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 flex items-center">
            <Hash className="h-4 w-4 mr-1 text-teal-500" />
            Dosis Administrada
          </span>
          <span className="text-teal-900 font-black text-2xl block mt-1">
            {['Polvo', 'Líquido', 'Crema', 'Inyectable'].includes(medicacion.formato)
              ? `${medicacion.cantidad_tomada} Dosis de ${medicacion.cantidad_tomada * medicacion.dosis_base} ${medicacion.unidad_dosis}`
              : `${medicacion.cantidad_tomada} ${medicacion.formato}(s) (${medicacion.cantidad_tomada * medicacion.dosis_base} ${medicacion.unidad_dosis})`}
          </span>
        </div>

        {/* Formato */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
            <Droplets className="h-4 w-4 mr-1 text-slate-400" />
            Vía / Formato
          </span>
          <span className="text-slate-800 font-bold text-lg block mt-1 capitalize">
            {medicacion.formato}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-teal-100 flex justify-end">
        <Button 
          type="button" 
          onClick={onClose}
          colorTheme={{
            bgNormal: 'bg-teal-600',
            bgHover: 'hover:bg-teal-700',
            textColor: 'text-white',
          }}
        >
          Salir
        </Button>
      </div>
    </div>
  );
};