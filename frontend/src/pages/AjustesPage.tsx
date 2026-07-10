import React from 'react';
import { useAjustes } from '../context/AjustesContext';
import { AjustesParametrosRegla } from '../features/ajustes/AjustesParametrosRegla';
import { AjusteVisibilidadRegla } from '../features/ajustes/AjusteVisibilidadRegla';

export const AjustesPage: React.FC = () => {
  const { ajustes } = useAjustes();
  const mostrarRegla = ajustes['mostrar_regla'] === 'true';

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-4">
        <span className="text-4xl">⚙️</span>
        <h1 className="text-3xl font-bold text-slate-800">Ajustes Generales</h1>
      </div>

      {/* CONTENEDOR DE AJUSTES A ANCHO COMPLETO */}
      <div className="space-y-6 w-full">
        <AjusteVisibilidadRegla />
        <AjustesParametrosRegla isVisible={mostrarRegla} />
      </div>
      
    </div>
  );
};