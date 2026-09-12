import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AjusteVisibilidadRegla } from '../features/ajustes/AjusteVisibilidadRegla';
import { AjusteObjetivoSueno } from '../features/ajustes/AjusteObjetivoSueno';
import { AjusteObjetivoPasos } from '../features/ajustes/AjusteObjetivoPasos';
import { AjusteUnidadesDosis } from '../features/ajustes/AjusteUnidadesDosis';
import { AjusteRachaEntrenamiento } from '../features/ajustes/AjusteRachaEntrenamiento';
import { RecordatoriosTabla } from '../features/ajustes/RecordatoriosTabla';

export const AjustesPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'seccion-regla', label: 'Seguimiento de Regla', emoji: '🩸' },
    { id: 'seccion-sueno', label: 'Objetivo de Sueño', emoji: '🛌' },
    { id: 'seccion-pasos', label: 'Objetivo de Pasos', emoji: '🚶' },
    { id: 'seccion-racha', label: 'Racha Entrenamientos', emoji: '🔥' },
    { id: 'seccion-recordatorios', label: 'Recordatorios', emoji: '🔔' },
    { id: 'seccion-unidades', label: 'Unidades Dosis', emoji: '💊' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-8 pb-24 relative">
      
      {/* MENÚ MÓVIL (Fijo arriba a la derecha) */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        {mobileMenuOpen && (
          <div className="absolute bottom-full right-0 mb-4 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[200px] flex flex-col gap-1 animate-in slide-in-from-bottom-2 fade-in">
            {sections.map(s => (
              <button 
                key={s.id} 
                onClick={() => scrollToSection(s.id)}
                className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-sm font-bold text-slate-600"
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* COLUMNA PRINCIPAL DE AJUSTES */}
      <div className="flex-1 space-y-6 w-full">
        <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-4 mb-8">
          <span className="text-4xl">⚙️</span>
          <h1 className="text-3xl font-bold text-slate-800">Ajustes Generales</h1>
        </div>

        {/* Añadimos un div envoltorio con su ID a cada sección (VisibilidadRegla ya lo tiene por dentro) */}
        <AjusteVisibilidadRegla />
        
        <div id="seccion-sueno" className="scroll-mt-20"><AjusteObjetivoSueno /></div>
        <div id="seccion-pasos" className="scroll-mt-20"><AjusteObjetivoPasos /></div>
        <div id="seccion-racha" className="scroll-mt-20"><AjusteRachaEntrenamiento /></div>
        <div id="seccion-recordatorios" className="scroll-mt-20"><RecordatoriosTabla /></div>
        <div id="seccion-unidades" className="scroll-mt-20"><AjusteUnidadesDosis /></div>
      </div>

      {/* MENÚ LATERAL (Ordenador) */}
      <div className="hidden md:block w-72 shrink-0">
        <div className="sticky top-24 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Índice Rápido</h3>
          <div className="flex flex-col gap-1">
            {sections.map(s => (
              <button 
                key={s.id} 
                onClick={() => scrollToSection(s.id)}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-sm font-bold text-slate-600 hover:text-indigo-600 group"
              >
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">{s.emoji}</span> 
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};