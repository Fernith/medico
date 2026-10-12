import React from 'react';
import { UsuarioDatosForm } from '../features/usuario/UsuarioDatosForm';
import { HabitosToxicosTabla } from '../features/usuario/HabitosToxicosTabla';
import { AlergiasTabla } from '../features/usuario/AlergiasTabla';
import { PatologiasTabla } from '../features/usuario/PatologiasTabla';
import { AntecedentesTabla } from '../features/usuario/AntecedentesTabla';

export const UsuarioPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center gap-3 border-b-2 border-indigo-200 pb-4">
        <span className="text-4xl">👤</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Perfil de Usuario</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Datos biométricos base, tóxicos y hábitos, alergias, patologías y antecedentes para medicina preventiva
          </p>
        </div>
      </div>

      {/* CONTENEDORES DE INFORMACIÓN */}
      <div className="space-y-8">
        <UsuarioDatosForm />
        <HabitosToxicosTabla />
        <AlergiasTabla />
        <PatologiasTabla />
        <AntecedentesTabla />
      </div>
      
    </div>
  );
};