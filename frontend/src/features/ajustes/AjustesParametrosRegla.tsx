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
  const [ciclo, setCiclo] = useState(duracionCicloActual || 28);
  const [periodo, setPeriodo] = useState(duracionPeriodoActual || 6);

  // Mantener sincronizado el estado local si cambian las props externas
  useEffect(() => {
    setCiclo(duracionCicloActual || 28);
    setPeriodo(duracionPeriodoActual || 6);
  }, [duracionCicloActual, duracionPeriodoActual]);

  if (!isVisible) return null;

  const handleSave = () => {
    onSave(ciclo, periodo);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-pink-100 mt-4">
      <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
        <span className="text-pink-500">🩸</span> Parámetros del Ciclo Menstrual
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración media del ciclo (días)
          </label>
          <Input 
            type="number" 
            value={ciclo} 
            onChange={(e) => setCiclo(Number(e.target.value))}
            min={15}
            max={60}
            className="w-full border-pink-200 focus:ring-pink-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración media del periodo (días)
          </label>
          <Input 
            type="number" 
            value={periodo} 
            onChange={(e) => setPeriodo(Number(e.target.value))}
            min={1}
            max={15}
            className="w-full border-pink-200 focus:ring-pink-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleSave}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          Guardar Parámetros
        </Button>
      </div>
    </div>
  );
};