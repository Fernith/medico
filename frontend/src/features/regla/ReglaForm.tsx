import React, { useState } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import type { Ciclo } from '../../utils/reglaCalculations';

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

// Tema Rosa para Regla (usa los valores por defecto del Input para el inputTheme)
const defaultTheme: FormColorTheme = {
  submitBg: 'bg-pink-500',
  submitHover: 'hover:bg-pink-600',
  boxBg: 'bg-pink-50/50',
  boxBorder: 'border-pink-100',
  textTitle: 'text-purple-900',
  textSub: 'text-pink-600/80',
  checkboxActive: 'peer-checked:bg-pink-500',
  inputTheme: {}
};

interface ReglaFormProps {
  initialData?: Ciclo | null;
  onSuccess: () => void;
  onCancel: () => void;
  colorTheme?: Partial<FormColorTheme>;
}

export const ReglaForm: React.FC<ReglaFormProps> = ({ initialData, onSuccess, onCancel, colorTheme = {} }) => {
  const theme = { ...defaultTheme, ...colorTheme };
  const hoy = new Date().toISOString().split('T')[0];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fecha_inicio: initialData ? initialData.fecha_inicio.split('T')[0] : hoy,
    fecha_fin: initialData && initialData.fecha_fin ? initialData.fecha_fin.split('T')[0] : '',
  });

  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.fecha_inicio) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin || null
      };

      const url = initialData ? `/api/ciclos/${initialData.id}` : '/api/ciclos';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Disparamos evento para que la ReglaPage también se actualice en vivo si estamos en ella
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'regla' }));
        onSuccess();
      } else {
        const errorText = await res.text();
        console.error("Error al guardar ciclo:", errorText);
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
                label="Inicio del periodo"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)} 
                required
                colorTheme={theme.inputTheme}
                icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                }
            />
            
            <Input
                type="date"
                label="Fin del periodo (Opcional)"
                value={formData.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                clearable
                onClear={() => handleChange('fecha_fin', '')}
                helperText="Déjalo en blanco si el periodo sigue en curso."
                className={!formData.fecha_fin ? 'border-dashed border-pink-300' : ''}
                colorTheme={theme.inputTheme}
                icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                }
            />
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
          disabled={isSubmitting || !formData.fecha_inicio}
          className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center ${theme.submitBg} ${theme.submitHover}`}
        >
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  );
};