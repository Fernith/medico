import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input'; 
import { Trash2, Beaker, Edit2, X } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface UnidadDosis {
  id: string;
  nombre: string;
  abreviatura: string;
}

export const AjusteUnidadesDosis: React.FC = () => {
  const [unidades, setUnidades] = useState<UnidadDosis[]>([]);
  
  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [abreviatura, setAbreviatura] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Borrado
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUnidades = async () => {
    try {
      const res = await fetch('/api/unidades-dosis');
      if (res.ok) setUnidades(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUnidades(); }, []);

  const resetForm = () => {
    setNombre('');
    setAbreviatura('');
    setEditingId(null);
  };

  const handleEdit = (u: UnidadDosis) => {
    setNombre(u.nombre);
    setAbreviatura(u.abreviatura);
    setEditingId(u.id);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!nombre || !abreviatura) return;
    setIsSubmitting(true);
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/unidades-dosis/${editingId}` : '/api/unidades-dosis';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, abreviatura })
      });

      if (res.ok) {
        resetForm();
        fetchUnidades();
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/unidades-dosis/${deleteId}`, { method: 'DELETE' });
      fetchUnidades();
      // Si estábamos editando justo el que borramos, reseteamos el form
      if (editingId === deleteId) resetForm();
    } catch (e) { console.error(e); } finally {
      setDeleteId(null);
    }
  };

  const inputTheme = { borderNormal: 'border-slate-200', borderFocus: 'focus:ring-teal-500 focus:border-teal-500', iconColor: 'text-teal-500' };

  return (
    <>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-teal-100 flex flex-col space-y-6 w-full">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-teal-900 flex items-center gap-2">
            <Beaker className="w-6 h-6 text-teal-500" /> Diccionario de Unidades Médicas
          </h2>
          <p className="text-sm text-slate-500">
            Añade o elimina unidades de medida (mg, gotas, inhalaciones...) para usar al registrar tus medicamentos.
          </p>
        </div>

        {/* FORMULARIO DE AÑADIR / EDITAR (Inline) */}
        <form onSubmit={handleSave} className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 grid grid-cols-1 sm:grid-cols-6 gap-4 items-end transition-all">
          <div className="sm:col-span-2">
            <Input label="Nombre (Ej: Miligramos)" value={nombre} onChange={(e) => setNombre(e.target.value)} colorTheme={inputTheme} required />
          </div>
          <div className="sm:col-span-2">
            <Input label="Abrev. (Ej: mg)" value={abreviatura} onChange={(e) => setAbreviatura(e.target.value)} colorTheme={inputTheme} required />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            {editingId && (
              <button 
                type="button" onClick={resetForm}
                className="flex-1 px-4 py-[11px] bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm mt-1 flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
            <button 
              type="submit" disabled={isSubmitting || !nombre || !abreviatura} 
              className={`flex-1 px-4 py-[11px] text-white rounded-xl font-bold transition-colors disabled:opacity-50 shadow-sm mt-1 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-500 hover:bg-teal-600'}`}
            >
              {editingId ? 'Actualizar' : 'Añadir'}
            </button>
          </div>
        </form>

        {/* TABLA DE RESULTADOS SCROLLEABLE */}
        <div className="border border-slate-100 rounded-xl bg-slate-50/50 overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Abreviatura</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map(u => (
                <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-100/50 transition-colors ${editingId === u.id ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3 font-bold text-slate-700">{u.nombre}</td>
                  <td className="px-4 py-3 text-teal-600 font-bold">{u.abreviatura}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(u)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {unidades.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                    No hay unidades personalizadas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onCancel={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Borrar Unidad" 
        description="⚠️ ¿Estás seguro de querer borrar esta unidad de medida? Esto no afectará a los medicamentos que ya la estén usando."
        variant="danger" 
        confirmText="Borrar" 
      />
    </>
  );
};