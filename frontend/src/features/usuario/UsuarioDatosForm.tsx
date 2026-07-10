import React, { useState, useEffect } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export interface Usuario {
  id: number;
  altura: number;
  sexo: 'Masculino' | 'Femenino'; 
}

const indigoInputTheme: Partial<InputColorTheme> = {
  borderNormal: 'border-indigo-200 hover:border-indigo-300',
  borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500',
  iconColor: 'text-indigo-500',
};

const indigoSelectTheme = {
  borderNormal: 'border-indigo-200',
  borderActive: 'border-indigo-500 ring-4 ring-indigo-50',
  borderHover: 'hover:border-indigo-300 hover:shadow-md',
  textSelected: 'text-indigo-900',
  iconColor: 'text-indigo-500',
  optionSelectedBg: 'bg-indigo-50',
  optionSelectedText: 'text-indigo-700',
  optionHoverBg: 'hover:bg-indigo-50/50',
  optionHoverText: 'hover:text-indigo-900',
  checkIcon: 'text-indigo-500'
};

export const UsuarioDatosForm: React.FC = () => {
  const [formData, setFormData] = useState<Usuario>({ id: 1, altura: 180, sexo: 'Masculino' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  // EFECTO NUEVO: Borra el mensaje a los 3 segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null);
      }, 2500);
      
      // Cleanup: si el componente se desmonta o el mensaje cambia antes de 3s, limpiamos el timer
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await fetch('/api/usuario');
        if (res.ok) {
          const data = await res.json();
          setFormData(data);
        }
      } catch (err) {
        console.error('Error al obtener usuario', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsuario();
  }, []);

  const handleChange = (campo: keyof Usuario, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setMensaje(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensaje(null);
    
    try {
      const res = await fetch('/api/usuario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altura: Number(formData.altura),
          sexo: formData.sexo
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setFormData(updated);
        setMensaje({ tipo: 'exito', texto: 'Datos del usuario actualizados.' });
      } else {
        const errorText = await res.text();
        setMensaje({ tipo: 'error', texto: `Error: ${errorText}` });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión al guardar los datos.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-indigo-500 animate-pulse font-medium">Cargando perfil...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 flex flex-col space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-indigo-900">Datos usuario</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Altura (cm)" 
          type="number" 
          value={formData.altura} 
          onChange={(e) => handleChange('altura', e.target.value)} 
          required 
          colorTheme={indigoInputTheme}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          }
        />

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-gray-700 pl-1">Sexo Biológico</label>
          <Select 
            value={formData.sexo}
            onChange={(val) => handleChange('sexo', val)}
            options={[
              { value: 'Masculino', label: 'Masculino' },
              { value: 'Femenino', label: 'Femenino' }
            ]}
            colorTheme={indigoSelectTheme}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-sm font-bold ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-indigo-50">
        <button 
          type="submit" 
          disabled={isSubmitting || !formData.altura}
          className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex justify-center items-center shadow-sm hover:shadow-indigo-500/30"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
};