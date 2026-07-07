import React, { useState, useEffect } from 'react';
import { PesosTabla } from '../features/peso/PesosTabla';
import { PesoGrafica } from '../features/peso/PesoGrafica';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { type PesoDB, calcularIMC, obtenerColorIMC, calcularPesoParaIMC } from '../utils/pesoCalculations';
import { PesoForm } from '../features/peso/PesoForm';

export const PesoPage: React.FC = () => {
  const [pesos, setPesos] = useState<PesoDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pesoToEdit, setPesoToEdit] = useState<PesoDB | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pesoToDelete, setPesoToDelete] = useState<string | number | null>(null);

  const ALTURA_DEFAULT = 180; 

  const fetchPesos = async () => {
    try {
      const res = await fetch('/api/pesos');
      if (res.ok) {
        const data = await res.json();
        // La API ya devuelve el 'promedio', solo los ordenamos
        const sorted = data.sort((a: PesoDB, b: PesoDB) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setPesos(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPesos();
    
    const handleRegistro = (e: any) => {
      if (e.detail === 'peso') fetchPesos();
    };
    
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const ultimoPeso = pesos.length > 0 ? pesos[0].peso : null;
  const imcActual = ultimoPeso ? calcularIMC(ultimoPeso, ALTURA_DEFAULT) : null;
  const infoIMC = imcActual ? obtenerColorIMC(imcActual) : null;

  const Sobrepeso = calcularPesoParaIMC(24.9, ALTURA_DEFAULT);
  const BajoPeso = calcularPesoParaIMC(18.5, ALTURA_DEFAULT);

  const confirmDelete = async () => {
    try {
      await fetch(`/api/pesos/${pesoToDelete}`, { method: 'DELETE' });
      fetchPesos();
      setDeleteModalOpen(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24">
      <div className="flex items-center gap-3 border-b-2 border-emerald-200 pb-4">
        <span className="text-4xl">⚖️</span>
        <h1 className="text-3xl font-bold text-slate-800">Seguimiento de Peso</h1>
      </div>

      {!isLoading && pesos.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* NUEVO COMPONENTE DE GRÁFICA */}
            <PesoGrafica data={pesos} altura={ALTURA_DEFAULT} />

            {/* WIDGET IMC */}
            {imcActual && infoIMC && (
              <div className={`p-6 rounded-2xl border flex items-center justify-between ${infoIMC.clases} transition-colors duration-500`}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-80">Índice de Masa Corporal</p>
                  <p className="text-4xl font-black mt-1">{imcActual}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{infoIMC.texto}</p>
                  <p className="text-sm opacity-80 mt-1">Límites sanos: {BajoPeso} - {Sobrepeso} kg</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-emerald-700">Historial</h2>
            <PesosTabla 
              pesos={pesos} 
              onEdit={(p) => { setPesoToEdit(p); setEditModalOpen(true); }}
              onDelete={(id) => { setPesoToDelete(id); setDeleteModalOpen(true); }}
            />
          </div>
        </div>
      )}

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Peso">
        {pesoToEdit && (
          <PesoForm 
            initialData={pesoToEdit} 
            onSuccess={() => setEditModalOpen(false)} 
            onCancel={() => setEditModalOpen(false)} 
          />
        )}
      </Modal>

      <ConfirmModal 
        isOpen={deleteModalOpen} 
        onCancel={() => setDeleteModalOpen(false)} 
        title="Borrar Registro" 
        description="¿Seguro que quieres borrar este peso? La gráfica se actualizará sola."
        onConfirm={confirmDelete}
        variant="danger"
        confirmText="Borrar"
      />
    </div>
  );
};