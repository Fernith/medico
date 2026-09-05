import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { RecordatorioForm, type Recordatorio } from './RecordatorioForm';
import { BellRing, Plus, Edit2, Trash2 } from 'lucide-react';

export const RecordatoriosTabla: React.FC = () => {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Recordatorio | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRecordatorios = async () => {
    try {
      const res = await fetch('/api/recordatorios');
      if (res.ok) setRecordatorios(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchRecordatorios();
    const handleRegistro = (e: any) => { if (e.detail === 'recordatorio') fetchRecordatorios(); };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/recordatorios/${deleteId}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('registroAgregado', { detail: 'recordatorio' }));
    } catch (e) { console.error(e); } finally { setDeleteId(null); }
  };

  const modalTheme = { titleColor: 'text-indigo-900', headerBorder: 'border-indigo-100', closeIconColor: 'text-slate-400', closeIconHover: 'hover:text-indigo-600', modalBorder: 'border-indigo-400' };

  const getEntidadLabel = (r: Recordatorio) => {
    if (r.entidad === 'fecha' && r.proxima_fecha) {
      return new Date(r.proxima_fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const map: any = { 'peso': 'BÁSCULA', 'medicion': 'MEDIDAS', 'pasos': 'PASOS', 'sueno': 'SUEÑO', 'entrenamiento': 'ENTRENAMIENTO' };
    return map[r.entidad] || r.entidad.toUpperCase();
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col mt-6">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-500"/> Alertas Personalizadas
          </h2>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" strokeWidth={3} /> Añadir
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-semibold">Clave</th>
                <th className="px-6 py-3 font-semibold">Nombre & Descripción</th>
                <th className="px-6 py-3 font-semibold text-center">Frecuencia</th>
                <th className="px-6 py-3 font-semibold text-center">Referencia</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recordatorios.map(r => (
                <tr key={r.clave} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400 font-mono text-xs">{r.clave}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700">{r.nombre}</p>
                    {r.descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{r.descripcion}</p>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">Cada {r.dias} d</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold tracking-widest ${r.entidad === 'fecha' ? 'text-blue-500' : 'text-slate-500'}`}>
                      {getEntidadLabel(r)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => setEditItem(r)} className="text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 className="w-5 h-5 inline" /></button>
                    <button onClick={() => setDeleteId(r.clave)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
                  </td>
                </tr>
              ))}
              {recordatorios.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No hay recordatorios configurados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir Recordatorio" size="lg" colorTheme={modalTheme}>
        <RecordatorioForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Recordatorio" size="lg" colorTheme={modalTheme}>
        {editItem && <RecordatorioForm initialData={editItem} onSuccess={() => setEditItem(null)} onCancel={() => setEditItem(null)} />}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Borrar Recordatorio" description="¿Seguro que quieres eliminar este recordatorio permanentemente?" variant="danger" confirmText="Borrar"
      />
    </>
  );
};