import React, { useState } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import type { PesoDB } from '../../utils/pesoCalculations';

// Centralizamos los colores, anidando la configuración específica del Input
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

// Tema Esmeralda para Peso
const defaultTheme: FormColorTheme = {
  submitBg: 'bg-emerald-500',
  submitHover: 'hover:bg-emerald-600',
  boxBg: 'bg-emerald-50/50',
  boxBorder: 'border-emerald-100',
  textTitle: 'text-emerald-900',
  textSub: 'text-emerald-600/80',
  checkboxActive: 'peer-checked:bg-emerald-500',
  inputTheme: {
    borderNormal: 'border-emerald-200 hover:border-emerald-300',
    borderFocus: 'focus:ring-emerald-500 focus:border-emerald-500',
    iconColor: 'text-emerald-500',
  }
};

interface PesoFormProps {
  initialData?: PesoDB | null;
  onSuccess: () => void;
  onCancel: () => void;
  colorTheme?: Partial<FormColorTheme>; 
}

export const PesoForm: React.FC<PesoFormProps> = ({ initialData, onSuccess, onCancel, colorTheme = {} }) => {
  const theme = { ...defaultTheme, ...colorTheme };
  const hoy = new Date().toISOString().split('T')[0];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    peso: initialData ? initialData.peso.toString() : '',
    fecha: initialData ? initialData.fecha.split('T')[0] : hoy,
    en_ayunas: initialData ? initialData.en_ayunas : true,
  });

  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.peso) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        peso: parseFloat(formData.peso),
        fecha: formData.fecha,
        en_ayunas: formData.en_ayunas
      };

      const url = initialData ? `/api/pesos/${initialData.id}` : '/api/pesos';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'peso' }));
        onSuccess();
      } else {
        const errorText = await res.text();
        console.error("Error al guardar:", errorText);
        alert(`Error al guardar: ${errorText}`);
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
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Fecha" 
            type="date" 
            value={formData.fecha} 
            onChange={(e) => handleChange('fecha', e.target.value)} 
            required 
            colorTheme={theme.inputTheme} // <--- Pasamos el sub-tema esmeralda
          />
          <Input 
            label="Peso (kg)" 
            type="number" 
            step="0.1" 
            placeholder="Ej: 70.5" 
            value={formData.peso} 
            onChange={(e) => handleChange('peso', e.target.value)} 
            clearable
            onClear={() => handleChange('peso', '')}
            required 
            colorTheme={theme.inputTheme} // <--- Pasamos el sub-tema esmeralda
          />
        </div>

        <div className={`flex items-center justify-between p-4 border rounded-xl ${theme.boxBg} ${theme.boxBorder}`}>
          <div>
            <p className={`font-semibold ${theme.textTitle}`}>Medición en ayunas</p>
            <p className={`text-xs ${theme.textSub}`}>Tomado nada más despertar</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={formData.en_ayunas}
              onChange={(e) => handleChange('en_ayunas', e.target.checked)}
            />
            <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${theme.checkboxActive}`}></div>
          </label>
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
          disabled={isSubmitting || !formData.peso}
          className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center ${theme.submitBg} ${theme.submitHover}`}
        >
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  );
};