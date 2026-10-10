import { useState, useEffect, useMemo, useRef } from 'react';
import { apiFetch } from '../../api/client';
import { type HistorialMedicacion } from '../medicamentos/HistorialMedicacionForm';
import { type OcurrenciaSintoma } from '../sintomas/SintomasTabla';

export type TimelineItemType = 'medicamento' | 'sintoma';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  date: Date;
  medicamento?: HistorialMedicacion;
  sintoma?: OcurrenciaSintoma;
}

export const useTimeline = () => {
  const [medicamentos, setMedicamentos] = useState<HistorialMedicacion[]>([]);
  const [sintomas, setSintomas] = useState<OcurrenciaSintoma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'medicamentos' | 'sintomas'>('todos');
  const [navDate, setNavDate] = useState<string>('');

  // Paginación infinita
  const [visibleCount, setVisibleCount] = useState(20);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
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
    if (!scrollContainerRef.current || isFetchingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Threshold para cargar más.
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (visibleCount < items.length) {
        setIsFetchingMore(true);
        // Pequeño delay artificial para que se vea el spinner como en Instagram
        setTimeout(() => {
          setVisibleCount(prev => Math.min(prev + 20, items.length));
          setIsFetchingMore(false);
        }, 500);
      }
    }
  };

  // Efecto para navegar a una fecha
  useEffect(() => {
    if (!navDate || !scrollContainerRef.current || groupedItems.length === 0) return;
    
    const [year, month, day] = navDate.split('-');
    const searchDateStr = `${year}-${month}-${day}`;
    
    // Buscamos el grupo exacto, o si no, el primer grupo que sea menor o igual
    let targetGroup = groupedItems.find(g => g.date <= searchDateStr);
    
    if (targetGroup) {
      // Calculamos cuántos elementos hay hasta este grupo para saber si necesitamos renderizar más
      let itemsBeforeTarget = 0;
      for (const group of groupedItems) {
        itemsBeforeTarget += group.items.length;
        if (group.date === targetGroup.date) break;
      }
      
      if (itemsBeforeTarget > visibleCount) {
         setVisibleCount(itemsBeforeTarget + 20); // Renderizamos suficiente
      }

      // El timeout da tiempo a React a renderizar los nuevos elementos
      setTimeout(() => {
        const el = document.getElementById(`group-${targetGroup.date}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      
    } else {
      // Si no encontró nada (es más antiguo que el último dato), ir al final
      const last = groupedItems[groupedItems.length - 1];
      setVisibleCount(items.length); // Renderizar todos
      
      setTimeout(() => {
        const el = document.getElementById(`group-${last.date}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [navDate]); // Removido groupedItems para evitar loops si cambia la referencia

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

  const hasMore = visibleCount < items.length;

  return {
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
  };
};
