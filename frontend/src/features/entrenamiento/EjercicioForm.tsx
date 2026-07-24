import React, { useState, useEffect } from 'react';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Type, AlignLeft, Image as ImageIcon, X } from 'lucide-react';

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

export interface GrupoMuscular {
  id: string;
  nombre: string;
  categoria: string;
}

export interface Ejercicio {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string; 
  grupos_ids: string[];
  grupos_nombres?: string[];
}

const defaultTheme: FormColorTheme = {
  submitBg: 'bg-indigo-600',
  submitHover: 'hover:bg-indigo-700',
  boxBg: 'bg-indigo-50/50',
  boxBorder: 'border-indigo-100',
  textTitle: 'text-indigo-900',
  textSub: 'text-indigo-600/80',
  checkboxActive: 'peer-checked:bg-indigo-600',
  inputTheme: {
    borderNormal: 'border-slate-200 hover:border-indigo-300',
    borderFocus: 'focus:ring-indigo-500 focus:border-indigo-500',
    iconColor: 'text-indigo-500',
  }
};

interface EjercicioFormProps {
  initialData?: Ejercicio | null;
  onSuccess: () => void;
  onCancel: () => void;
  colorTheme?: Partial<FormColorTheme>;
}

export const EjercicioForm: React.FC<EjercicioFormProps> = ({ initialData, onSuccess, onCancel, colorTheme = {} }) => {
  const theme = { ...defaultTheme, ...colorTheme };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoMuscular[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    imagen: initialData?.imagen || '',
    grupos_ids: initialData?.grupos_ids || [] as string[],
  });

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const res = await fetch('/api/grupos-musculares');
        if (res.ok) setGruposDisponibles(await res.json());
      } catch (err) {
        console.error("Error cargando grupos musculares:", err);
      }
    };
    fetchGrupos();
  }, []);

  const handleChange = (campo: string, valor: string | string[]) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const toggleGrupo = (id: string) => {
    setFormData(prev => {
      const seleccionados = prev.grupos_ids.includes(id)
        ? prev.grupos_ids.filter(item => item !== id)
        : [...prev.grupos_ids, id];
      return { ...prev, grupos_ids: seleccionados };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // MANTENER ANIMACIÓN: Si es un GIF, omitimos el redimensionado del canvas
        if (file.type === 'image/gif') {
          handleChange('imagen', reader.result as string);
          return;
        }

        // REDIMENSIONADO: Para JPEG, PNG, etc., optimizamos el tamaño
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1080; const MAX_HEIGHT = 1080;
          let width = img.width; let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height = Math.round(height * (MAX_WIDTH / width)); width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width = Math.round(width * (MAX_HEIGHT / height)); height = MAX_HEIGHT; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Guardamos como webp o png (para mantener transparencias si las hay)
            handleChange('imagen', canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp', 0.8));
          } else {
            handleChange('imagen', reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.nombre) { alert("El nombre es obligatorio"); return; }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(initialData ? `/api/ejercicios/${initialData.id}` : '/api/ejercicios', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'ejercicio' }));
        onSuccess();
      } else {
        alert(`Error: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const gruposPorCategoria = gruposDisponibles.reduce((acc, grupo) => {
    const cat = grupo.categoria || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(grupo);
    return acc;
  }, {} as Record<string, GrupoMuscular[]>);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="space-y-6 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 gap-4">
          
          <Input
            type="text" label="Nombre del Ejercicio" placeholder="Ej: Press de Banca"
            value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} 
            required colorTheme={theme.inputTheme} icon={<Type className="w-5 h-5" />}
          />

          <Input
            type="text" label="Descripción o notas técnicas" placeholder="Ej: Mantener retracción escapular..."
            value={formData.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)}
            colorTheme={theme.inputTheme} icon={<AlignLeft className="w-5 h-5" />}
          />

          {/* GRUPOS MUSCULARES */}
          <div className="space-y-3 mt-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Grupos Musculares Implicados</label>
            
            <div className="space-y-4 pl-1">
              {Object.entries(gruposPorCategoria).map(([categoria, grupos]) => (
                <div key={categoria} className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{categoria}</span>
                  <div className="flex flex-wrap gap-2">
                    {grupos.map((grupo) => {
                      const activo = formData.grupos_ids.includes(grupo.id);
                      return (
                        <button
                          key={grupo.id} type="button" onClick={() => toggleGrupo(grupo.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border ${
                            activo ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {grupo.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SUBIDA DE IMAGEN (OPCIONAL) */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-sm font-bold text-slate-700">Imagen o GIF de Referencia</label>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Opcional</span>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center w-full max-w-[150px] h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none">
                <span className="flex items-center space-x-2">
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <span className="font-medium text-slate-600 text-sm">Subir archivo</span>
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              {formData.imagen && (
                <div className="relative w-32 h-32 rounded-xl border border-slate-200 shadow-sm group">
                  <img src={formData.imagen} alt="Vista" className="object-cover w-full h-full rounded-xl bg-black/5" />
                  {/* Botón para eliminar la imagen */}
                  <button 
                    type="button" 
                    onClick={() => handleChange('imagen', '')}
                    className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-rose-500 border border-slate-200 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar imagen"
                  >
                    <X className="w-4 h-4" strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="flex gap-4">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting || !formData.nombre} className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center ${theme.submitBg} ${theme.submitHover}`}>
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  );
};