import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input, type InputColorTheme } from '../../components/ui/Input';
import { Type, AlignLeft, Image as ImageIcon, X } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { apiFetch } from '../../api/client';


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
  tipo_entrenamiento_id?: string;
  tipo_entrenamiento_nombre?: string;
  grupos_ids: string[];
  grupos_nombres?: string[];
  activo: boolean;
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
  isReadOnly?: boolean;
}

export const EjercicioForm: React.FC<EjercicioFormProps> = ({ initialData, onSuccess, onCancel, colorTheme = {}, isReadOnly = false }) => {
  const theme = { ...defaultTheme, ...colorTheme };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tiposEntrenamiento, setTiposEntrenamiento] = useState<{id: string, nombre: string}[]>([]);
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoMuscular[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    imagen: initialData?.imagen || '',
    tipo_entrenamiento_id: initialData?.tipo_entrenamiento_id || '',
    grupos_ids: initialData?.grupos_ids || [] as string[],
  });

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const res = await apiFetch('/api/grupos-musculares');
        if (res.ok) setGruposDisponibles(await res.json());
      } catch (err) {
        console.error("Error cargando grupos musculares:", err);
      }
    };
    fetchGrupos();
    const fetchTipos = async () => {
      try {
        const res = await apiFetch('/api/tipos-entrenamiento');
        if (res.ok) setTiposEntrenamiento(await res.json());
      } catch (err) { console.error("Error cargando tipos:", err); }
    };
    fetchTipos();
  }, []);

  const handleChange = (campo: string, valor: string | string[]) => {
    if(isReadOnly) return;
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const toggleGrupo = (id: string) => {
    if(isReadOnly) return;
    setFormData(prev => {
      const seleccionados = prev.grupos_ids.includes(id)
        ? prev.grupos_ids.filter(item => item !== id)
        : [...prev.grupos_ids, id];
      return { ...prev, grupos_ids: seleccionados };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(isReadOnly) return;
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
      const res = await apiFetch(initialData ? `/api/ejercicios/${initialData.id}` : '/api/ejercicios', {
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
            disabled={isReadOnly}
          />
          
          <Select 
            label={<span>Tipo de Entrenamiento <span className="text-gray-400 font-normal">(Opcional)</span></span> as any}
            placeholder="Seleccionar tipo..."
            options={tiposEntrenamiento.map(t => ({ value: t.id, label: t.nombre }))}
            value={formData.tipo_entrenamiento_id}
            onChange={(val) => handleChange('tipo_entrenamiento_id', val)}
            disabled={isReadOnly}
          />

          {/* GRUPOS MUSCULARES */}
          <div className="space-y-3 mt-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">
              Grupos Musculares Implicados <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            
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
                          disabled={isReadOnly}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border ${
                            activo ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          } ${isReadOnly ? 'cursor-default opacity-80' : ''}`}
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

          <div className="space-y-1 mt-4">
            <label className="block text-sm font-bold text-slate-700 mb-1 pl-1">
              Descripción o notas técnicas <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative flex items-start">
              <div className={`absolute top-3 left-4 ${isReadOnly ? 'text-gray-400' : theme.inputTheme.iconColor} pointer-events-none`}>
                <AlignLeft className="w-5 h-5" />
              </div>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                disabled={isReadOnly}
                placeholder="Ej: Mantener retracción escapular..."
                className={`w-full bg-white border rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed pl-11 pr-4 py-3 ${theme.inputTheme.borderNormal} ${theme.inputTheme.borderFocus}`}
                rows={3}
              />
            </div>
          </div>

          {/* SUBIDA DE IMAGEN (OPCIONAL) */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-sm font-bold text-slate-700">
                Imagen o GIF de Referencia <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              {!isReadOnly && (
                <label className="flex items-center justify-center w-full max-w-[150px] h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                    <span className="font-medium text-slate-600 text-sm">Subir archivo</span>
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isReadOnly} />
                </label>
              )}

              {formData.imagen ? (
                <div className="relative w-32 h-32 rounded-xl border border-slate-200 shadow-sm group">
                  <img src={formData.imagen} alt="Vista" className="object-cover w-full h-full rounded-xl bg-black/5" />
                  {!isReadOnly && (
                    <button 
                      type="button" 
                      onClick={() => handleChange('imagen', '')}
                      className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-rose-500 border border-slate-200 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar imagen"
                    >
                      <X className="w-4 h-4" strokeWidth={3} />
                    </button>
                  )}
                </div>
              ) : (
                isReadOnly && <div className="text-sm text-slate-400 italic">No hay imagen</div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="flex gap-4">
        {isReadOnly ? (
          <Button 
            type="button" 
            onClick={onCancel} 
            colorTheme={{ bgNormal: theme.submitBg, bgHover: theme.submitHover, textColor: 'text-white', focusRing: 'focus:ring-indigo-500' }} 
            className="w-full py-3"
          >
            Salir
          </Button>
        ) : (
          <>
            <Button variant="ghost" type="button" onClick={onCancel} className="flex-1 py-3">Cancelar</Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.nombre} 
              isLoading={isSubmitting} 
              colorTheme={{ bgNormal: theme.submitBg, bgHover: theme.submitHover, textColor: 'text-white', focusRing: 'focus:ring-indigo-500' }} 
              className="flex-1 py-3"
            >
              {initialData ? 'Actualizar' : 'Guardar'}
            </Button>
          </>
        )}
      </div>
    </form>
  );
};