import React from 'react';
import { UsuarioDatosForm } from '../features/usuario/UsuarioDatosForm';

export const UsuarioPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center gap-3 border-b-2 border-indigo-200 pb-4">
        <span className="text-4xl">👤</span>
        <h1 className="text-3xl font-bold text-slate-800">Perfil de Usuario</h1>
      </div>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="space-y-6">
        <UsuarioDatosForm />
      </div>
      
    </div>
  );
};