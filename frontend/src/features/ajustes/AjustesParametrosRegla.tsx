import React, { useState, useEffect } from 'react';
// Importamos tus componentes UI existentes
import { Input } from '../../components/ui/Input'; 
import { Button } from '../../components/ui/Button';

// Asumimos que tienes un hook o función en AjustesContext para actualizar valores
interface AjustesParametrosReglaProps {
  duracionCicloActual: number;
  duracionPeriodoActual: number;
  onSave: (ciclo: number, periodo: number) => void;
  isVisible: boolean;
}

export const AjustesParametrosRegla: React.FC<AjustesParametrosReglaProps> = ({ 
  duracionCicloActual, 
  duracionPeriodoActual, 
  onSave, 
  isVisible 
}) => {
  const [ciclo, setCiclo] = useState<number | ''>(duracionCicloActual || 28);
  const [periodo, setPeriodo] = useState<number | ''>(duracionPeriodoActual || 6);
  

  // Mantener sincronizado el estado local si cambian las props externas
  useEffect(() => {
    setCiclo(duracionCicloActual || 28);
    setPeriodo(duracionPeriodoActual || 6);
  }, [duracionCicloActual, duracionPeriodoActual]);

  if (!isVisible) return null;

  const handleSave = () => {
    // Si el valor es un string vacío, lo convertimos a 0, si no, pasamos el número
    const cicloFinal = ciclo === '' ? 0 : ciclo;
    const periodoFinal = periodo === '' ? 0 : periodo;
    
    onSave(cicloFinal, periodoFinal);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-pink-100 mt-4">
      <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
        <span className="text-pink-500">🩸</span> Parámetros del Ciclo Menstrual
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          type="number" 
          label="Duración media del ciclo (días)"
          value={ciclo} 
          onChange={(e) => setCiclo(e.target.value === '' ? '' : Number(e.target.value))}
          clearable
          onClear={() => setCiclo('')}
          min={15}
          max={60}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
          colorTheme={{
            borderNormal: 'border-pink-200 hover:border-pink-300',
            borderFocus: 'focus:ring-pink-500 focus:border-pink-500',
            iconColor: 'text-pink-500',
            labelColor: 'text-gray-700'
          }}
        />
        
        <Input 
          type="number" 
          label="Duración media del periodo (días)"
          value={periodo} 
          onChange={(e) => setPeriodo(e.target.value === '' ? '' : Number(e.target.value))}
          clearable
          onClear={() => setPeriodo('')}
          min={1}
          max={15}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
          colorTheme={{
            borderNormal: 'border-pink-200 hover:border-pink-300',
            borderFocus: 'focus:ring-pink-500 focus:border-pink-500',
            iconColor: 'text-pink-500',
            labelColor: 'text-gray-700'
          }}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleSave}
          variant="primary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          }
        >
          Guardar Parámetros
        </Button>
      </div>
    </div>
  );
};