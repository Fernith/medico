import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { useTimeline } from './useTimeline';
import { CATALOGO_ANATOMIA } from '../../utils/anatomia';
import { type OcurrenciaSintoma } from '../sintomas/SintomasTabla';

const getNombreLocalizacion = (id: string) => {
  const loc = CATALOGO_ANATOMIA.find(c => c.id === id);
  return loc ? loc.nombre : id;
};

const getSintomaValor = (o: OcurrenciaSintoma) => {
  if (o.valor_registro === 'true') return 'Presente';
  if (o.valor_registro === 'false') return 'Ausente';
  if (!o.valor_registro) return '-';
  if (o.regla_medicion === 'escala_1_10') return `${o.valor_registro}/10`;
  if (o.regla_medicion === 'conteo_episodios') return o.valor_registro === '1' ? '1 episodio' : `${o.valor_registro} episodios`;
  if (o.regla_medicion === 'grados_celsius') return `${o.valor_registro}ºC`;
  if (o.regla_medicion === 'cualitativa_3') return o.valor_registro === '1' ? 'Leve' : o.valor_registro === '2' ? 'Moderada' : 'Grave';
  return o.valor_registro;
};

export const TimelineScroll: React.FC = () => {
  const {
    isLoading,
    filtroTipo,
    setFiltroTipo,
    navDate,
    setNavDate,
    visibleGroups,
    scrollContainerRef,
    handleScroll,
    hasMore,
    isFetchingMore,
  } = useTimeline();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p>Cargando línea temporal...</p>
      </div>
    );
  }

  const formatHora = (d: Date) => {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getFormatedDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Zona de filtros (Sticky top) */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center gap-4 w-full sm:w-auto ml-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={navDate}
              onChange={e => setNavDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm bg-white"
          >
            <option value="todos">Todos</option>
            <option value="medicamentos">Solo Medicamentos</option>
            <option value="sintomas">Solo Síntomas</option>
          </select>
        </div>
      </div>

      {/* Contenedor de Scroll infinito sin scrollbar visible */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide bg-slate-50/50"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <div className="max-w-4xl mx-auto relative">
          {visibleGroups.map(group => (
            <div key={group.date} id={`group-${group.date}`} className="mb-10 relative">
              {/* Etiqueta de Fecha */}
              <div className="flex justify-center mb-6 sticky top-0 z-20">
                <div className="bg-white border border-slate-200 shadow-sm px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 capitalize flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {getFormatedDate(group.date)}
                </div>
              </div>
              
              <div className="space-y-4">
                {group.items.map(item => {
                  if (item.type === 'medicamento' && item.medicamento) {
                    const m = item.medicamento;
                    const color = m.categoria_color || '#3b82f6';
                    
                    const isDosis = ['Polvo', 'Líquido', 'Crema', 'Inyectable'].includes(m.formato);
                    const dosisTotal = m.cantidad_tomada * m.dosis_base;
                    const tomaDisplay = isDosis 
                      ? `${m.cantidad_tomada} Dosis de ${dosisTotal} ${m.unidad_dosis}` 
                      : `${m.cantidad_tomada} ${m.formato}(s) (${dosisTotal} ${m.unidad_dosis})`;

                    return (
                      <div key={item.id} className="flex justify-start w-full relative">
                        <div 
                          className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border-l-4 w-[85%] sm:w-[75%] flex flex-col gap-1.5 hover:shadow-md transition-shadow"
                          style={{ borderLeftColor: color }}
                        >
                          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-slate-700">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                              {formatHora(item.date)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-50" style={{ color: color }}>
                              {m.categoria_nombre || 'Sin categoría'}
                            </span>
                          </div>
                          <div className="flex justify-between items-end mt-1">
                            <span className="font-extrabold text-slate-800 text-base">{m.medicamento_nombre}</span>
                            <span className="text-sm font-bold text-slate-400">
                              {tomaDisplay}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'sintoma' && item.sintoma) {
                    const s = item.sintoma;
                    const valorDisplay = getSintomaValor(s);
                      
                    return (
                      <div key={item.id} className="flex justify-end w-full relative">
                        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border-r-4 border-rose-500 w-[85%] sm:w-[75%] flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                          {/* Arriba: localizaciones y la hora */}
                          <div className="flex justify-between items-start text-xs font-medium">
                            <div className="flex flex-wrap gap-1">
                              {s.localizaciones && s.localizaciones.length > 0 ? (
                                s.localizaciones.map((loc, i) => (
                                  <span key={i} className={`px-2 py-0.5 rounded-md text-xs border whitespace-nowrap ${loc.es_irradiado ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {getNombreLocalizacion(loc.localizacion_id)}
                                    {loc.lado ? ` (${loc.lado})` : ''}
                                  </span>
                                ))
                              ) : <span className="text-slate-400 italic text-xs">Sin ubicación</span>}
                            </div>
                            <span className="flex items-center gap-1.5 font-bold text-slate-400 whitespace-nowrap ml-2">
                              {formatHora(item.date)}
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                            </span>
                          </div>
                          {/* Abajo: síntomas e intensidad */}
                          <div className="flex justify-between items-end mt-2">
                            <span className="font-extrabold text-slate-800 text-base">{s.sintoma_nombre}</span>
                            <span className="text-sm font-bold text-rose-600">
                              {valorDisplay}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          
          {visibleGroups.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              No hay eventos para mostrar con los filtros actuales.
            </div>
          )}

          {isFetchingMore && hasMore && visibleGroups.length > 0 && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      </div>
      
      {/* CSS extra para ocultar scrollbar en navegadores */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </div>
  );
};