import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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
  const realMonth = hoy.getMonth();
  const realYear = hoy.getFullYear();
  
  // POR DEFECTO AL PULSAR EL BOTÓN "HOY":
  // PC: Izquierda=Mes Anterior, Derecha=Mes Actual
  // Móvil: Mes Actual
  const defaultMonth = isMobile ? realMonth : (realMonth === 0 ? 11 : realMonth - 1);
  const defaultYear = isMobile ? realYear : (realMonth === 0 ? realYear - 1 : realYear);

  const [currentMonth, setCurrentMonth] = useState(defaultMonth);
  const [currentYear, setCurrentYear] = useState(defaultYear);

  // LÍMITES MÍNIMOS Y MÁXIMOS
  const minYear = 2026;
  const isAtMinLimit = currentYear <= minYear && currentMonth === 0;

  // Límite máximo absoluto que el calendario izquierdo puede mostrar:
  // PC: Hasta el mes actual (así la derecha muestra el mes siguiente).
  // Móvil: Hasta el mes siguiente.
  const maxLeftMonth = isMobile ? (realMonth === 11 ? 0 : realMonth + 1) : realMonth;
  const maxLeftYear = isMobile ? (realMonth === 11 ? realYear + 1 : realYear) : realYear;

  const isAtMaxLimit = currentYear > maxLeftYear || (currentYear === maxLeftYear && currentMonth >= maxLeftMonth);

  // Corrector de seguridad por si redimensionamos la pantalla y los límites cambian
  useEffect(() => {
    if (currentYear > maxLeftYear || (currentYear === maxLeftYear && currentMonth > maxLeftMonth)) {
      setCurrentYear(maxLeftYear);
      setCurrentMonth(maxLeftMonth);
    }
  }, [isMobile, maxLeftYear, maxLeftMonth]);

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
    setCurrentMonth(defaultMonth);
    setCurrentYear(defaultYear);
  };

  // Nombres de los meses: Cortos para móvil, Largos para PC
  const mesesStr = isMobile 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  // Filtramos las opciones de los Selectores para no dejar elegir fechas prohibidas
  const yearOptions = Array.from({ length: maxLeftYear - minYear + 1 }, (_, i) => minYear + i)
    .map(y => ({ value: y, label: y.toString() }));

  const monthOptions = mesesStr.map((m, i) => ({ value: i, label: m }))
    .filter(opt => currentYear < maxLeftYear || opt.value <= maxLeftMonth);

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-indigo-100 flex flex-col h-full">
      
      {/* NAVEGADOR (Centrado en móvil, Derecha en PC) */}
      <div className="flex justify-center md:justify-end mb-6 shrink-0">
        
        {/* El contenedor ahora usa justify-between w-full en móvil para que las flechas tengan espacio */}
        <div className="flex items-center justify-between sm:justify-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
          <button 
            onClick={handlePrev} 
            disabled={isAtMinLimit}
            className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-indigo-600" />
          </button>
          
          {/* SELECTORES NATIVOS (Mismo formato que en PasosGrafica.tsx) */}
          <div className="flex items-center gap-1 px-1 sm:px-2">
            <select 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className={`bg-slate-100 hover:bg-indigo-50 focus:bg-indigo-50 font-bold text-slate-500 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer rounded-lg py-1 transition-all ${isMobile ? 'px-1 text-center' : 'px-2'}`}
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="text-slate-700">{opt.label}</option>
              ))}
            </select>
            <select 
              value={currentYear} 
              onChange={(e) => {
                const newY = Number(e.target.value);
                setCurrentYear(newY);
                if (newY === maxLeftYear && currentMonth > maxLeftMonth) {
                  setCurrentMonth(maxLeftMonth);
                }
              }}
              className={`bg-slate-100 hover:bg-indigo-50 focus:bg-indigo-50 font-bold text-slate-500 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer rounded-lg py-1 transition-all ${isMobile ? 'px-1 text-center' : 'px-2'}`}
            >
              {yearOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="text-slate-700">{opt.label}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleNext} 
            disabled={isAtMaxLimit}
            className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
          >
            <ChevronRight className="w-5 h-5 text-indigo-600" />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-0.5 sm:mx-1 shrink-0"></div>
          
          <button 
            onClick={handleIrAHoy} 
            disabled={currentMonth === defaultMonth && currentYear === defaultYear}
            className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-indigo-500 disabled:opacity-30 disabled:hover:bg-transparent shrink-0" 
            title="Ir a fecha actual"
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RENDERIZADO DE MESES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[300px]">
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