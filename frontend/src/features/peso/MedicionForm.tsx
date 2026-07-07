import React, { useState } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';

export interface FormColorTheme {
  submitBg: string;
  submitHover: string;
  boxBg: string;
  boxBorder: string;
  textTitle: string;
  textSub: string;
  checkboxActive: string;
  inputTheme: Partial<InputColorTheme>;
}

// Interfaz local temporal hasta que movamos todo a utils/medicionCalculations
export interface Medicion {
  id: string | number;
  fecha: string;
  cm_cintura: number | null;
  cm_cadera: number | null;
}

// Tema Rose (Frambuesa) para Medidas Corporales
const defaultTheme: FormColorTheme = {
  submitBg: 'bg-rose-500',
  submitHover: 'hover:bg-rose-600',
  boxBg: 'bg-rose-50/50',
  boxBorder: 'border-rose-100',
  textTitle: 'text-rose-900',
  textSub: 'text-rose-600/80',
  checkboxActive: 'peer-checked:bg-rose-500',
  inputTheme: {
    borderNormal: 'border-rose-200 hover:border-rose-300',
    borderFocus: 'focus:ring-rose-500 focus:border-rose-500',
    iconColor: 'text-rose-500',
  }
};

interface MedicionFormProps {
  initialData?: Medicion | null;
  onSuccess: () => void;
  onCancel: () => void;
  colorTheme?: Partial<FormColorTheme>;
}

export const MedicionForm: React.FC<MedicionFormProps> = ({ initialData, onSuccess, onCancel, colorTheme = {} }) => {
  const theme = { ...defaultTheme, ...colorTheme };
  const hoy = new Date().toISOString().split('T')[0];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fecha: initialData ? initialData.fecha.split('T')[0] : hoy,
    cm_cintura: initialData && initialData.cm_cintura ? initialData.cm_cintura.toString() : '',
    cm_cadera: initialData && initialData.cm_cadera ? initialData.cm_cadera.toString() : '',
  });

  const handleChange = (campo: string, valor: string) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.fecha) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        fecha: formData.fecha,
        cm_cintura: formData.cm_cintura ? parseFloat(formData.cm_cintura) : null,
        cm_cadera: formData.cm_cadera ? parseFloat(formData.cm_cadera) : null
      };

      const url = initialData ? `/api/mediciones/${initialData.id}` : '/api/mediciones';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Disparamos evento para que la futura tabla de medidas se actualice en vivo
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicion' }));
        onSuccess();
      } else {
        const errorText = await res.text();
        console.error("Error al guardar medición:", errorText);
        alert(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 gap-4">
            <Input
                type="date"
                label="Fecha de la medición"
                value={formData.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)} 
                required
                colorTheme={theme.inputTheme}
                icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                }
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                  type="number"
                  step="0.1"
                  label="Cintura (cm)"
                  placeholder="Ej: 85.5"
                  value={formData.cm_cintura}
                  onChange={(e) => handleChange('cm_cintura', e.target.value)}
                  clearable
                  onClear={() => handleChange('cm_cintura', '')}
                  colorTheme={theme.inputTheme}
                  icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/* Icono de regla medidora */}
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-6-8v8m12-8v8"></path>
                  </svg>
                  }
              />

              <Input
                  type="number"
                  step="0.1"
                  label="Cadera (cm)"
                  placeholder="Ej: 95.0"
                  value={formData.cm_cadera}
                  onChange={(e) => handleChange('cm_cadera', e.target.value)}
                  clearable
                  onClear={() => handleChange('cm_cadera', '')}
                  colorTheme={theme.inputTheme}
                  icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-6-8v8m12-8v8"></path>
                  </svg>
                  }
              />
            </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting || !formData.fecha}
          className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center ${theme.submitBg} ${theme.submitHover}`}
        >
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  );
};