import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiFetch } from '../../api/client';
import { type HistorialMedicacion } from '../medicamentos/HistorialMedicacionForm';
import { type OcurrenciaSintoma } from '../sintomas/SintomasTabla';
import { Activity, Calendar } from 'lucide-react';

type TimelineItemType = 'medicamento' | 'sintoma';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  date: Date;
  medicamento?: HistorialMedicacion;
  sintoma?: OcurrenciaSintoma;
}

export const TimelineScroll: React.FC = () => {
  const [medicamentos, setMedicamentos] = useState<HistorialMedicacion[]>([]);
  const [sintomas, setSintomas] = useState<OcurrenciaSintoma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'medicamentos' | 'sintomas'>('todos');
  const [navDate, setNavDate] = useState<string>('');

  // Paginación infinita
  const [visibleCount, setVisibleCount] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resMed, resSin] = await Promise.all([
          apiFetch('/api/historial-medicacion'),
          apiFetch('/api/sintomas/ocurrencias')
        ]);
        
        if (resMed.ok) {
          const meds: HistorialMedicacion[] = await resMed.json();
          setMedicamentos(meds.filter(m => !m.pendiente));
        }
        if (resSin.ok) {
          const sins: OcurrenciaSintoma[] = await resSin.json();
          setSintomas(sins);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const items = useMemo(() => {
    const combined: TimelineItem[] = [];
    
    if (filtroTipo === 'todos' || filtroTipo === 'medicamentos') {
      medicamentos.forEach(m => {
        combined.push({
          id: `med-${m.id}`,
          type: 'medicamento',
          date: new Date(m.fecha_hora),
          medicamento: m,
        });
      });
    }

    if (filtroTipo === 'todos' || filtroTipo === 'sintomas') {
      sintomas.forEach(s => {
        combined.push({
          id: `sin-${s.id}`,
          type: 'sintoma',
          date: new Date(s.fecha_inicio),
          sintoma: s,
        });
      });
    }

    // Ordenar del más actual al más antiguo
    return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [medicamentos, sintomas, filtroTipo]);

  // Agrupar por fecha local
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: TimelineItem[] } = {};
    items.forEach(item => {
      // YYYY-MM-DD para agrupar localmente sin desfase horario
      const dateKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}-${String(item.date.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    
    // Sort groups desc
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(key => ({
      date: key,
      items: groups[key]
    }));
  }, [items]);

  // Efecto para scroll infinito
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Si estamos a 100px del final
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount(prev => Math.min(prev + 20, items.length));
    }
  };

  // Efecto para navegar a una fecha
  useEffect(() => {
    if (!navDate || !scrollContainerRef.current) return;
    
    // Encontrar el elemento más cercano (o el grupo)
    // El id del grupo es `group-${dateKey}`
    
    const [year, month, day] = navDate.split('-');
    const searchDateStr = `${year}-${month}-${day}`;
    
    // Buscamos el grupo exacto, o si no, el primer grupo que sea menor o igual (como está ordenado desc, buscamos el primero que sea <= searchDateStr)
    let targetGroup = groupedItems.find(g => g.date <= searchDateStr);
    
    if (targetGroup) {
      const el = document.getElementById(`group-${targetGroup.date}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (groupedItems.length > 0) {
      // Si no hay ninguno menor, vamos al último (más antiguo)
      const last = groupedItems[groupedItems.length - 1];
      const el = document.getElementById(`group-${last.date}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [navDate, groupedItems]);

  const visibleGroups = useMemo(() => {
    let count = 0;
    const result = [];
    for (const group of groupedItems) {
      if (count >= visibleCount) break;
      const groupItems = group.items.slice(0, visibleCount - count);
      result.push({ ...group, items: groupItems });
      count += groupItems.length;
    }
    return result;
  }, [groupedItems, visibleCount]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Cargando línea temporal...</div>;
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
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Zona de filtros (Sticky top) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-800">Línea Temporal</h2>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={navDate}
              onChange={e => setNavDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">Todos (Med y Sín)</option>
            <option value="medicamentos">Solo Medicamentos</option>
            <option value="sintomas">Solo Síntomas</option>
          </select>
        </div>
      </div>

      {/* Contenedor de Scroll infinito sin scrollbar visible */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <div className="max-w-4xl mx-auto relative">
          {/* Línea central */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>
          
          {visibleGroups.map(group => (
            <div key={group.date} id={`group-${group.date}`} className="mb-8 relative">
              {/* Etiqueta de Fecha */}
              <div className="flex justify-center mb-6 relative z-10">
                <div className="bg-white border border-slate-200 shadow-sm px-4 py-1.5 rounded-full text-sm font-medium text-slate-600 capitalize">
                  {getFormatedDate(group.date)}
                </div>
              </div>
              
              <div className="space-y-6">
                {group.items.map(item => {
                  if (item.type === 'medicamento' && item.medicamento) {
                    const m = item.medicamento;
                    const color = m.categoria_color || '#3b82f6'; // fallback blue
                    return (
                      <div key={item.id} className="flex justify-start items-center w-full relative">
                        <div className="w-1/2 pr-8 flex justify-end">
                          <div 
                            className="bg-white p-3 rounded-lg shadow-sm border-l-4 max-w-sm w-full flex items-center justify-between"
                            style={{ borderLeftColor: color }}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>{formatHora(item.date)}</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100" style={{ color: color }}>
                                  {m.categoria_nombre || 'Sin categoría'}
                                </span>
                              </div>
                              <div className="flex justify-between items-end mt-1">
                                <span className="font-semibold text-slate-800">{m.medicamento_nombre}</span>
                                <span className="text-sm font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                                  {m.cantidad_tomada} {m.unidad_dosis}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Punto central */}
                        <div className="absolute left-1/2 w-3 h-3 rounded-full border-2 border-white -translate-x-1/2 z-10" style={{ backgroundColor: color }}></div>
                      </div>
                    );
                  } else if (item.type === 'sintoma' && item.sintoma) {
                    const s = item.sintoma;
                    // Format from right to left: hora, sintoma, intensidad y localizacion
                    const locs = s.localizaciones && s.localizaciones.length > 0 
                      ? s.localizaciones.map(l => l.localizacion_id).join(', ') 
                      : '';
                    return (
                      <div key={item.id} className="flex justify-end items-center w-full relative">
                        <div className="w-1/2 pl-8 flex justify-start">
                          <div className="bg-red-50 p-3 rounded-lg shadow-sm border border-red-100 max-w-sm w-full flex items-center justify-between">
                            <div className="flex flex-col gap-1 w-full text-right">
                              <div className="flex justify-between items-center text-xs text-red-400 font-medium flex-row-reverse">
                                <span>{formatHora(item.date)}</span>
                                <span className="text-red-500 font-semibold truncate max-w-[150px]">{s.sintoma_nombre}</span>
                              </div>
                              <div className="flex justify-between items-end mt-1 flex-row-reverse">
                                <span className="font-medium text-red-900">{s.valor_registro || '-'}</span>
                                <span className="text-xs text-red-700 max-w-[200px] truncate" title={locs}>
                                  {locs}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Punto central */}
                        <div className="absolute left-1/2 w-3 h-3 rounded-full bg-red-400 border-2 border-white -translate-x-1/2 z-10"></div>
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