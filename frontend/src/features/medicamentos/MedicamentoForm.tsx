import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pill, Scale, FileText, Tag, Droplet } from 'lucide-react';
import { type CategoriaMedicamento } from './CategoriasTabla';

export interface Medicamento {
  id: string; nombre: string; categoria_id?: string | null; categoria_nombre?: string | null;
  formato: string; dosis: number; unidad_dosis: string; notas?: string | null;
}

interface MedicamentoFormProps { initialData?: Medicamento | null; onSuccess: () => void; onCancel: () => void; }

const FORMATOS = ['Pastilla', 'Cápsula', 'Polvo', 'Líquido', 'Crema', 'Inyectable'];

export const MedicamentoForm: React.FC<MedicamentoFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [categorias, setCategorias] = useState<CategoriaMedicamento[]>([]);
  const [unidadesDosis, setUnidadesDosis] = useState<{value: string, label: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    categoria_id: initialData?.categoria_id || '',
    formato: initialData?.formato || 'Pastilla',
    dosis: initialData?.dosis?.toString() || '',
    unidad_dosis: initialData?.unidad_dosis || 'mg',
    notas: initialData?.notas || ''
  });

  useEffect(() => {
    fetch('/api/categorias-medicamentos').then(res => res.json()).then(setCategorias).catch(console.error);
    
    // Cargar diccionario dinámico de unidades
    fetch('/api/unidades-dosis').then(res => res.json()).then(data => {
      setUnidadesDosis(data.map((u: any) => ({ value: u.abreviatura, label: `${u.nombre} (${u.abreviatura})` })));
    }).catch(console.error);
  }, []);

  const handleChange = (campo: string, valor: any) => setFormData(prev => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.dosis || !formData.unidad_dosis) return;
    setIsSubmitting(true);
    try {
      const payload = { ...formData, categoria_id: formData.categoria_id || null, dosis: parseFloat(formData.dosis) };
      const url = initialData ? `/api/medicamentos/${initialData.id}` : '/api/medicamentos';
      const res = await fetch(url, { method: initialData ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'medicamento' }));
        onSuccess();
      } else alert(`Error: ${await res.text()}`);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const inputTheme = { borderNormal: 'border-slate-200', borderFocus: 'focus:ring-teal-500 focus:border-teal-500', iconColor: 'text-teal-500' };
  const selectTheme = { borderNormal: 'border-slate-200', borderActive: 'border-teal-400 ring-4 ring-teal-50', iconColor: 'text-teal-500', optionSelectedBg: 'bg-teal-50', optionSelectedText: 'text-teal-800' };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <Input label="Nombre del Medicamento / Suplemento" placeholder="Ej: Ibuprofeno, Creatina..." value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} colorTheme={inputTheme} icon={<Pill className="w-5 h-5" />} />
      
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-700 ml-1">Categoría</label>
        <Select value={formData.categoria_id} onChange={(val) => handleChange('categoria_id', val)} options={[{value: '', label: 'Sin categoría'}, ...categorias.map(c => ({ value: c.id, label: c.nombre }))]} icon={<Tag className="w-5 h-5" />} colorTheme={selectTheme} />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-700 ml-1">Formato</label>
        <Select value={formData.formato} onChange={(val) => handleChange('formato', val)} options={FORMATOS.map(f => ({ value: f, label: f }))} icon={<Droplet className="w-5 h-5" />} colorTheme={selectTheme} />
      </div>

      {/* ARREGLO DE LAYOUT: Columnas simétricas en móviles/PC para que no se corte el texto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input type="number" step="0.1" label="Dosis (Por unidad/toma)" placeholder="Ej: 500" value={formData.dosis} onChange={(e) => handleChange('dosis', e.target.value)} colorTheme={inputTheme} icon={<Scale className="w-5 h-5" />} />
        
        <div className="space-y-1">
          <label className="block text-sm font-bold text-slate-700 ml-1">Unidad de medida</label>
          <Select 
            value={formData.unidad_dosis} 
            onChange={(val) => handleChange('unidad_dosis', val)} 
            options={unidadesDosis.length > 0 ? unidadesDosis : [{value: 'mg', label: 'Miligramos (mg)'}]} 
            colorTheme={selectTheme} 
          />
        </div>
      </div>

      <Input label="Notas (opcional)" placeholder="Ej: Evitar tomar con el estómago vacío" value={formData.notas} onChange={(e) => handleChange('notas', e.target.value)} colorTheme={inputTheme} icon={<FileText className="w-5 h-5" />} />
      
      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !formData.nombre} className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors">{isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar')}</button>
      </div>
    </form>
  );
};