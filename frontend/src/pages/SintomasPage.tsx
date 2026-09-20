import React from 'react';
import { SintomasForm } from '../features/sintomas/SintomasForm';

export const SintomasPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center gap-3 border-b-2 border-rose-200 pb-4">
        <span className="text-4xl">🩺</span>
        <h1 className="text-3xl font-bold text-slate-800">Registro de Síntomas</h1>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="space-y-6">
        <SintomasForm />
      </div>
      
    </div>
  );
};