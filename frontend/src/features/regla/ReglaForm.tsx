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

const CARAS = [
  { val: 1, emoji: '😫', label: 'Fatal', color: 'text-rose-700 bg-rose-100 hover:bg-rose-200 border-rose-300', active: 'bg-rose-500 text-white border-rose-600 shadow-md' },
  { val: 2, emoji: '😔', label: 'Mal', color: 'text-orange-700 bg-orange-100 hover:bg-orange-200 border-orange-300', active: 'bg-orange-400 text-white border-orange-500 shadow-md' },
  { val: 3, emoji: '😐', label: 'Regular', color: 'text-amber-800 bg-amber-100 hover:bg-amber-200 border-amber-300', active: 'bg-yellow-300 border-yellow-400 shadow-md' },
  { val: 4, emoji: '😊', label: 'Bien', color: 'text-lime-800 bg-lime-100 hover:bg-lime-200 border-lime-300', active: 'bg-lime-400 border-lime-500 shadow-md' },
  { val: 5, emoji: '🤩', label: 'Genial', color: 'text-emerald-800 bg-emerald-100 hover:bg-emerald-300 border-emerald-400', active: 'bg-emerald-600 border-emerald-700 shadow-md' },
];

export const ReglaForm: React.FC<ReglaFormProps> = ({ initialData, onSuccess, onCancel, colorTheme = {} }) => {
  const theme = { ...defaultTheme, ...colorTheme };
  const hoy = new Date().toISOString().split('T')[0];
  
  // LOGICA: Si initialData tiene inicio pero NO fin, significa que es el ciclo "en curso".
  const esCicloEnCurso = initialData && !initialData.fecha_fin;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fecha_inicio: initialData ? initialData.fecha_inicio.split('T')[0] : hoy,
    fecha_fin: initialData && initialData.fecha_fin ? initialData.fecha_fin.split('T')[0] : (esCicloEnCurso ? hoy : ''),
    estado_animo: initialData?.estado_animo || null,
    sensacion: initialData?.sensacion || '',
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
        fecha_fin: formData.fecha_fin || null,
        estado_animo: formData.fecha_fin ? formData.estado_animo : null, // Solo guardamos estado si hay fin
        sensacion: formData.fecha_fin ? formData.sensacion : null,
      };

      const url = initialData ? `/api/ciclos/${initialData.id}` : '/api/ciclos';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'regla' }));
        onSuccess();
      } else {
        const errorText = await res.text();
        alert(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[75vh]">
      <div className="space-y-6 mb-8 overflow-y-auto pr-2 custom-scrollbar flex-1">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Inicio del periodo"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)} 
            required
            disabled={esCicloEnCurso || false}
            colorTheme={theme.inputTheme}
          />
          
          <Input
            type="date"
            label="Fin del periodo (Opcional)"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            clearable
            onClear={() => handleChange('fecha_fin', '')}
            min={formData.fecha_inicio}
            helperText={!formData.fecha_fin ? "En blanco si sigue en curso" : ""}
            className={!formData.fecha_fin ? 'border-dashed border-pink-300' : ''}
            colorTheme={theme.inputTheme}
          />
        </div>

        {/* --- SECCIÓN CONDICIONAL: Solo aparece si rellenamos fecha_fin --- */}
        {formData.fecha_fin && (
          <div className="space-y-6 pt-6 border-t border-pink-100 animate-in fade-in slide-in-from-top-4 duration-300">
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-purple-900 text-center">¿Cómo te has sentido en general?</label>
              <div className="flex justify-between items-center gap-2 sm:gap-4 bg-slate-50 p-2 sm:p-4 rounded-2xl border border-slate-100">
                {CARAS.map(cara => {
                  const isSelected = formData.estado_animo === cara.val;
                  return (
                    <button
                      key={cara.val}
                      type="button"
                      onClick={() => handleChange('estado_animo', cara.val)}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 border-2 ${isSelected ? cara.active : cara.color}`}
                    >
                      <span className="text-3xl sm:text-4xl mb-1 filter drop-shadow-sm">{cara.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{cara.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Notas y Sensaciones</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-400 transition-all min-h-[120px] resize-none font-medium"
                value={formData.sensacion || ''} 
                onChange={e => handleChange('sensacion', e.target.value)} 
                placeholder="Escribe aquí cómo ha sido el flujo, dolores, humor, etc..."
              />
            </div>
            
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4 shrink-0">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting || !formData.fecha_inicio} className={`flex-[2] px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center shadow-sm ${theme.submitBg} ${theme.submitHover}`}>
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar Registro' : (formData.fecha_fin ? 'Finalizar Periodo' : 'Iniciar Periodo'))}
        </button>
      </div>
    </form>
  );
};