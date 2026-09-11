import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { CalendarioMesEntreno } from './CalendarioMesEntreno';

interface CalendarioSelectorProps {
  calendarioRutinas: Record<string, { rutina_nombre: string; color: string | null }[]>;
}

export const CalendarioSelector: React.FC<CalendarioSelectorProps> = ({ calendarioRutinas }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const hoy = new Date();
  
  // En móvil mostramos el mes actual. En PC mostramos el mes anterior (para que el actual quede a la derecha).
  const initialMonth = isMobile ? hoy.getMonth() : (hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1);
  const initialYear = isMobile ? hoy.getFullYear() : (hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear());

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);

  // Lógica de límites
  const minYear = 2026;
  const isAtMinLimit = currentYear <= minYear && currentMonth === 0;

  // Límite superior: mes actual (Móvil) o mes anterior (PC, para que la derecha sea el actual)
  const maxMonthLimit = isMobile ? hoy.getMonth() : (hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1);
  const maxYearLimit = isMobile ? hoy.getFullYear() : (hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear());
  
  const isAtMaxLimit = currentYear > maxYearLimit || (currentYear === maxYearLimit && currentMonth >= maxMonthLimit);

  const handlePrev = () => {
    if (isAtMinLimit) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (isAtMaxLimit) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleIrAHoy = () => {
    setCurrentMonth(initialMonth);
    setCurrentYear(initialYear);
  };

  const mesesStr = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const selectTheme = { borderNormal: 'border-indigo-100', borderActive: 'border-indigo-400 ring-2 ring-indigo-50', textSelected: 'text-indigo-900', optionSelectedBg: 'bg-indigo-50', optionSelectedText: 'text-indigo-800' };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-indigo-100">
      
      {/* NAVEGADOR SUPERIOR */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={handlePrev} 
            disabled={isAtMinLimit}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5 text-indigo-600" />
          </button>
          
          <div className="flex gap-2 min-w-[260px] justify-center">
            <Select 
              value={currentMonth} 
              onChange={(val) => setCurrentMonth(Number(val))}
              options={mesesStr.map((m, i) => ({ value: i, label: m }))}
              colorTheme={selectTheme}
              className="text-center font-bold text-sm min-w-[150px]" 
            />
            <Select 
              value={currentYear} 
              onChange={(val) => {
                const newY = Number(val);
                setCurrentYear(newY);
                if (newY === maxYearLimit && currentMonth > maxMonthLimit) {
                  setCurrentMonth(maxMonthLimit);
                }
              }}
              options={Array.from({ length: hoy.getFullYear() - minYear + 1 }, (_, i) => minYear + i).map(y => ({ value: y, label: y.toString() }))}
              colorTheme={selectTheme}
              className="text-center font-bold text-sm min-w-[110px]" 
            />
          </div>

          <button 
            onClick={handleNext} 
            disabled={isAtMaxLimit}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-5 h-5 text-indigo-600" />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          <button 
            onClick={handleIrAHoy} 
            disabled={isAtMaxLimit && currentMonth === initialMonth && currentYear === initialYear}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-indigo-500 disabled:opacity-30 disabled:hover:bg-transparent" 
            title="Ir a este mes"
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RENDERIZADO DE MESES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-72">
        <CalendarioMesEntreno 
          year={currentYear} 
          month={currentMonth} 
          calendarioRutinas={calendarioRutinas} 
        />
        
        {!isMobile && (
          <CalendarioMesEntreno 
            year={currentMonth === 11 ? currentYear + 1 : currentYear} 
            month={currentMonth === 11 ? 0 : currentMonth + 1} 
            calendarioRutinas={calendarioRutinas} 
          />
        )}
      </div>

    </div>
  );
};