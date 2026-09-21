import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ZoomIn, Layers, Activity, RotateCcw } from 'lucide-react';
import { CATALOGO_ANATOMIA, type LocalizacionAnatomica } from '../../utils/anatomia';
import { 
  SVG_ATLAS_FRONTAL, 
  SVG_ATLAS_POSTERIOR, 
  SVG_ATLAS_FRONTAL_MUJER,   // Añade este diccionario a tu svgAnatomia.ts
  SVG_ATLAS_POSTERIOR_MUJER  // Añade este diccionario a tu svgAnatomia.ts
} from '../../utils/svgAnatomia';
import { useAjustes } from '../../context/AjustesContext';

export interface ZonaSeleccionada {
  localizacion_id: string;
  nombre: string;
  es_irradiado: boolean;
  lado: 'Izquierdo' | 'Derecho' | 'Ambos' | null;
}

interface Props {
  onSelectionChange: (selecciones: ZonaSeleccionada[]) => void;
}

const NOMBRES_ZONA_ARCHIVO: Record<string, string> = {
  'Cuerpo Completo': 'cuerpo_completo',
  'Extremidad Inferior': 'extremidad_inferior',
  'Extremidad Superior': 'extremidad_superior',
  'Cabeza y Cuello': 'cabeza_cuello',
  'Tronco': 'tronco',
};

export const SintomasAnatomiaMapa: React.FC<Props> = ({ onSelectionChange }) => {
  // 1. Extraemos el contexto de Ajustes
  const { ajustes } = useAjustes();
  const sexoUsuario = ajustes['sexo'] || 'masculino'; // Por defecto 'masculino' por seguridad

  const [selecciones, setSelecciones] = useState<ZonaSeleccionada[]>([]);
  const [historialLupa, setHistorialLupa] = useState<string[]>([]);
  const [vistaPosterior, setVistaPosterior] = useState(false);

  useEffect(() => {
    onSelectionChange(selecciones);
  }, [selecciones, onSelectionChange]);

  const currentParentId = historialLupa.length > 0 ? historialLupa[historialLupa.length - 1] : null;
  const currentViewName = currentParentId 
    ? CATALOGO_ANATOMIA.find(l => l.id === currentParentId)?.nombre || ''
    : 'Cuerpo Completo';

  const zonasVisibles = useMemo(() => {
    return CATALOGO_ANATOMIA.filter(l => l.parent_id === currentParentId && l.id !== 'sistemico');
  }, [currentParentId]);

  const zonaSistemica = useMemo(() => CATALOGO_ANATOMIA.find(l => l.id === 'sistemico'), []);
  const selSistemico = selecciones.find(s => s.localizacion_id === zonaSistemica?.id);

  const zonasConHijosSeleccionadas = useMemo(() => {
    return selecciones.filter(sel => 
      CATALOGO_ANATOMIA.some(l => l.parent_id === sel.localizacion_id)
    );
  }, [selecciones]);

  const handleZoneClick = (zona: LocalizacionAnatomica) => {
    setSelecciones(prev => {
      const index = prev.findIndex(s => s.localizacion_id === zona.id);
      if (index === -1) {
        return [...prev, { localizacion_id: zona.id, nombre: zona.nombre, es_irradiado: false, lado: null }];
      }
      const existing = prev[index];
      if (!existing.es_irradiado) {
        const updated = [...prev];
        updated[index] = { ...existing, es_irradiado: true };
        return updated;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleLadoChange = (id: string, lado: 'Izquierdo' | 'Derecho' | 'Ambos') => {
    setSelecciones(prev => prev.map(s => s.localizacion_id === id ? { ...s, lado } : s));
  };

  const hacerZoom = (id: string) => {
    setHistorialLupa(prev => [...prev, id]);
  };

  const handleVolver = () => {
    setHistorialLupa(prev => prev.slice(0, -1));
  };

  // =========================================================================
  // GESTIÓN DINÁMICA DE IMÁGENES Y ATLAS
  // =========================================================================
  
  // 1. Obtener la base del archivo (ej: 'tronco', 'cuerpo_completo')
  const baseArchivo = NOMBRES_ZONA_ARCHIVO[currentViewName];
  
  // 2. Determinar sufijos de vista y sexo
  const sufijoVista = vistaPosterior ? 'posterior' : 'frontal';
  const sufijoSexo = sexoUsuario === 'femenino' ? 'mujer' : 'varon';

  // 3. Ensamblar la URL final
  const bgImageUrl = baseArchivo 
    ? `/cuerpo_humano/${baseArchivo}_${sufijoVista}_${sufijoSexo}.webp` 
    : '';

  // 4. Seleccionar el Atlas correcto cruzando Vista y Sexo
  const ATLAS_ACTIVO = vistaPosterior 
    ? (sexoUsuario === 'femenino' ? SVG_ATLAS_POSTERIOR_MUJER : SVG_ATLAS_POSTERIOR)
    : (sexoUsuario === 'femenino' ? SVG_ATLAS_FRONTAL_MUJER : SVG_ATLAS_FRONTAL);

  // =========================================================================

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      
      {/* COLUMNA IZQUIERDA: EL MAPA SVG */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Navegador Lupa y Vista */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleVolver}
              disabled={historialLupa.length === 0}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-black text-slate-700 text-sm tracking-widest uppercase">
              {currentViewName}
            </span>
          </div>

          <div className="p-2 text-rose-300">
            <ZoomIn className="w-5 h-5" />
          </div>
        </div>

        {/* CONTENEDOR SVG */}
        <div className="relative w-full aspect-[1/1] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
          
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            {/* BOTÓN FLOTANTE SISTÉMICO (Solo en Nivel 1) */}
            {zonaSistemica && currentParentId === null && (
              <button
                onClick={() => handleZoneClick(zonaSistemica)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all border ${
                  selSistemico 
                    ? selSistemico.es_irradiado 
                      ? 'bg-orange-500 border-orange-600 text-white' 
                      : 'bg-rose-500 border-rose-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                Sistémico
                {selSistemico && <span className="ml-1 text-[10px] uppercase opacity-80">{selSistemico.es_irradiado ? '(Irradia)' : '(Foco)'}</span>}
              </button>
            )}

            {/* BOTÓN GIRAR CUERPO (¡AHORA SIEMPRE VISIBLE!) */}
            <button
              onClick={() => setVistaPosterior(!vistaPosterior)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all border bg-slate-800 border-slate-900 text-white hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              {vistaPosterior ? 'Ver Frontal' : 'Ver Posterior'}
            </button>
          </div>

          <svg viewBox="0 0 210 297" className="w-full h-full max-h-[650px]">
            
            {/* IMAGEN DE FONDO (JPG/WEBP) */}
            {bgImageUrl && (
              <image 
                href={bgImageUrl} 
                x="0" y="0" width="100%" height="100%" 
                preserveAspectRatio="xMidYMid meet" 
              />
            )}

            {/* 
              CAPA DE CALIBRACIÓN: 
              Como la imagen nueva es más estrecha que el SVG original, 
              aplicamos un 'scale' menor a 1 (ej: 0.85) para encoger el SVG rojo.
              Ajusta el translate (X, Y) y el scale (ancho, alto) hasta que encaje perfecto.
            */}
            <g transform="translate(1, 1) scale(1.16, 1.17)">
              
              {zonasVisibles.map((zona, index) => {
                const sel = selecciones.find(s => s.localizacion_id === zona.id);
                
                const fillColor = sel 
                  ? (sel.es_irradiado ? 'rgba(251, 191, 36, 0.5)' : 'rgba(244, 63, 94, 0.5)') 
                  : 'transparent'; 

                const pathData = ATLAS_ACTIVO[zona.nombre];

                return (
                  <g 
                    key={zona.id} 
                    onClick={() => handleZoneClick(zona)}
                    className="cursor-pointer transition-all hover:opacity-80"
                  >
                    {pathData ? (
                      <path 
                        d={pathData} 
                        fill={fillColor} 
                        stroke={sel ? 'transparent' : 'rgba(203, 213, 225, 0.3)'}
                        strokeWidth="1" 
                      />
                    ) : (
                      // Cajas Fallback temporales
                      <g transform={`translate(${(index % 3) * 60 + 10}, ${Math.floor(index / 3) * 40 + 50})`}>
                        <rect width="50" height="25" rx="4" fill={fillColor} stroke="#cbd5e1" strokeWidth="1" />
                        <text x="25" y="15" fontSize="6" fontWeight="bold" fill={sel ? '#fff' : '#64748b'} textAnchor="middle">
                          {zona.nombre}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* COLUMNA DERECHA: PANELES DE CONTROL */}
      <div className="w-full xl:w-80 flex flex-col gap-4">
        
        {zonasConHijosSeleccionadas.length > 0 && (
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-indigo-900 text-sm">Explorar Detalle</h3>
            </div>
            <p className="text-xs text-indigo-700/80 mb-3 font-medium">Haz clic para definir el punto exacto de la zona seleccionada:</p>
            <div className="flex flex-col gap-2">
              {zonasConHijosSeleccionadas.map(zona => (
                <button
                  key={zona.localizacion_id}
                  type="button"
                  onClick={() => hacerZoom(zona.localizacion_id)}
                  className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-sm font-bold py-2 px-3 rounded-xl transition-all shadow-sm flex justify-between items-center"
                >
                  <span>Entrar en {zona.nombre}</span>
                  <ZoomIn className="w-4 h-4 opacity-70" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Zonas Registradas</h3>
          
          {selecciones.length === 0 ? (
            <div className="text-center text-slate-400 text-xs font-medium py-8 border-2 border-dashed border-slate-100 rounded-xl">
              Ninguna zona seleccionada
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selecciones.map(sel => {
                // Buscamos la zona en el catálogo para saber si es bilateral
                const zonaEnCatalogo = CATALOGO_ANATOMIA.find(l => l.id === sel.localizacion_id);

                return (
                  <div key={sel.localizacion_id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${sel.es_irradiado ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                        {sel.nombre} {sel.es_irradiado && '(Irradia)'}
                      </span>
                    </div>
                    
                    {/* Selector de lateralidad (Solo se muestra si es_bilateral es true) */}
                    {zonaEnCatalogo?.es_bilateral && (
                      <div className="flex gap-1 mt-1">
                        {(['Izquierdo', 'Derecho', 'Ambos'] as const).map(lado => (
                          <button
                            key={lado}
                            type="button"
                            onClick={() => handleLadoChange(sel.localizacion_id, lado)}
                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-colors border ${
                              sel.lado === lado 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {lado === 'Ambos' ? lado : lado.substring(0, 3) + '.'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};