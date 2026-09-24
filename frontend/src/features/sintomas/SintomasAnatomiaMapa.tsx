import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ZoomIn, Layers, PersonStanding, RotateCcw, Trash2, Loader2, Home } from 'lucide-react';
import { CATALOGO_ANATOMIA, type LocalizacionAnatomica } from '../../utils/anatomia';
import { 
  SVG_ATLAS_FRONTAL, 
  SVG_ATLAS_POSTERIOR, 
  SVG_ATLAS_FRONTAL_MUJER,   
  SVG_ATLAS_POSTERIOR_MUJER  
} from '../../utils/svgAnatomia';
import { useUsuario } from '../../context/UsuarioContext';

export interface ZonaSeleccionada {
  localizacion_id: string;
  nombre: string;
  es_irradiado: boolean;
  lado: 'Izquierdo' | 'Derecho' | 'Ambos' | null;
}

interface Props {
  onSelectionChange: (zonas: ZonaSeleccionada[]) => void;
  initialSelection?: ZonaSeleccionada[];
  isReadOnly?: boolean;
}

const NOMBRES_ZONA_ARCHIVO: Record<string, string> = {
  'Cuerpo Completo': 'cuerpo_completo',
  'Extremidad Inferior': 'extremidad_inferior',
  'Extremidad Superior': 'extremidad_superior',
  'Cabeza y Cuello': 'cabeza_cuello',
  'Tronco': 'tronco',
};

export const SintomasAnatomiaMapa: React.FC<Props> = ({ onSelectionChange, initialSelection, isReadOnly }) => {
  const { datosUsuario } = useUsuario();
  const sexoUsuario = datosUsuario.sexo || 'masculino'; 
  
  const [selecciones, setSelecciones] = useState<ZonaSeleccionada[]>(initialSelection || []);
  const [historialLupa, setHistorialLupa] = useState<string[]>([]);
  const [vistaPosterior, setVistaPosterior] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

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

  const zonasNavegables = useMemo(() => {
    return zonasVisibles.filter(zona => 
      CATALOGO_ANATOMIA.some(l => l.parent_id === zona.id)
    );
  }, [zonasVisibles]);

  const handleZoneClick = (zona: LocalizacionAnatomica) => {
    if (isReadOnly) return;
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

  const handleRemoveZone = (id: string) => {
    if (isReadOnly) return;
    setSelecciones(prev => prev.filter(s => s.localizacion_id !== id));
  };

  const handleLadoChange = (id: string, lado: 'Izquierdo' | 'Derecho' | 'Ambos') => {
    if (isReadOnly) return;
    setSelecciones(prev => prev.map(s => s.localizacion_id === id ? { ...s, lado } : s));
  };

  const hacerZoom = (id: string) => {
    setHistorialLupa(prev => [...prev, id]);
  };

  const handleVolver = () => {
    setHistorialLupa(prev => prev.slice(0, -1));
  };

  const baseArchivo = NOMBRES_ZONA_ARCHIVO[currentViewName];
  const sufijoVista = vistaPosterior ? 'posterior' : 'frontal';
  const sufijoSexo = sexoUsuario === 'femenino' ? 'mujer' : 'varon';

  const bgImageUrl = baseArchivo 
    ? `/cuerpo_humano/${baseArchivo}_${sufijoVista}_${sufijoSexo}.webp` 
    : '';

  useEffect(() => {
    if (bgImageUrl) {
      setIsImageLoading(true);
    }
  }, [bgImageUrl]);

  const ATLAS_ACTIVO = vistaPosterior 
    ? (sexoUsuario === 'femenino' ? SVG_ATLAS_POSTERIOR_MUJER : SVG_ATLAS_POSTERIOR)
    : (sexoUsuario === 'femenino' ? SVG_ATLAS_FRONTAL_MUJER : SVG_ATLAS_FRONTAL);

  const panelNavegacion = (
    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-indigo-900 text-sm">Navegación ({currentViewName})</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {currentParentId !== null && (
          <div className="col-span-2 flex gap-2 mb-2 pb-2 border-b border-indigo-200/50">
            <button
              type="button"
              onClick={handleVolver}
              className="flex-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 text-xs font-bold py-2 px-2 rounded-xl transition-all shadow-sm flex justify-center items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" /> Atrás
            </button>
            <button
              type="button"
              onClick={() => setHistorialLupa([])}
              className="flex-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 text-xs font-bold py-2 px-2 rounded-xl transition-all shadow-sm flex justify-center items-center gap-1"
            >
              <Home className="w-3 h-3" /> Inicio
            </button>
          </div>
        )}

        {zonasNavegables.length > 0 ? (
          zonasNavegables.map(zona => (
            <button
              key={zona.id}
              type="button"
              onClick={() => hacerZoom(zona.id)}
              className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-xs font-bold py-1.5 px-2 rounded-xl transition-all shadow-sm flex justify-between items-center"
            >
              <span className="truncate mr-1">{zona.nombre}</span>
              <ZoomIn className="w-3 h-3 opacity-70 shrink-0" />
            </button>
          ))
        ) : (
          <p className="text-xs text-indigos-700/80 font-medium text-center py-2">
            Nivel de máximo detalle
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex-1 flex flex-col gap-4">
        
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
              1
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">Ubicación ({currentViewName})</h2>
              <p className="text-xs text-slate-500">Toca las zonas afectadas</p>
            </div>
          </div>
        </div>

        <div>
          {panelNavegacion}
        </div>

        <div className="relative w-full aspect-[1/1] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
          
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            {zonaSistemica && currentParentId === null && (
              <button
                type="button"
                onClick={() => handleZoneClick(zonaSistemica)}
                title="Sistémico (Foco/Irradiado)"
                className={`flex items-center justify-center gap-2 p-2 rounded-full font-bold text-sm shadow-md transition-all border ${
                  selSistemico 
                    ? selSistemico.es_irradiado 
                      ? 'bg-orange-500 border-orange-600 text-white' 
                      : 'bg-rose-500 border-rose-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                >
                  <PersonStanding className="w-5 h-5 shrink-0" />
                </button>
            )}

            <button
              type="button"
              onClick={() => setVistaPosterior(!vistaPosterior)}
              title={vistaPosterior ? 'Ver Frontal' : 'Ver Posterior'}
              className="flex items-center justify-center gap-2 p-2 rounded-full font-bold text-sm shadow-md transition-all border bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <RotateCcw className="w-5 h-5 shrink-0" />
            </button>
          </div>

          {isImageLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
          )}

          <svg viewBox="0 0 210 297" className="w-full h-full max-h-[650px]">
            {bgImageUrl && (
              <image 
                href={bgImageUrl} 
                x="0" y="0" width="100%" height="100%" 
                preserveAspectRatio="xMidYMid meet" 
                onLoad={() => setIsImageLoading(false)}
              />
            )}

            <g transform="translate(1, 1) scale(1.16, 1.17)">
              {zonasVisibles.map((zona) => {
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
                    {pathData && (
                      <path 
                        d={pathData} 
                        fill={fillColor} 
                        stroke={sel ? 'transparent' : 'rgba(203, 213, 225, 0.3)'}
                        strokeWidth="1" 
                      />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4">
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Zonas Registradas</h3>
          
          {selecciones.length === 0 ? (
            <div className="text-center text-slate-400 text-xs font-medium py-8 border-2 border-dashed border-slate-100 rounded-xl">
              Ninguna zona seleccionada
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-112 overflow-y-auto pr-1">
              {selecciones.map(sel => {
                const zonaEnCatalogo = CATALOGO_ANATOMIA.find(l => l.id === sel.localizacion_id);

                return (
                  <div key={sel.localizacion_id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${sel.es_irradiado ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {sel.nombre} {sel.es_irradiado && '(Irradia)'}
                      </span>
                      {!isReadOnly && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveZone(sel.localizacion_id)} 
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Eliminar zona"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      )}
                    </div>
                    
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