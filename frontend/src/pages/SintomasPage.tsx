import React, { useState } from 'react';
import { SintomasForm } from '../features/sintomas/SintomasForm';
import { SintomasTabla, type OcurrenciaSintoma } from '../features/sintomas/SintomasTabla';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { apiFetch } from '../api/client';

export const SintomasPage: React.FC = () => {
  // Modal de borrar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal de ver
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [itemToView, setItemToView] = useState<OcurrenciaSintoma | null>(null);

  // Modal de edición
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<OcurrenciaSintoma | null>(null);

  const handleView = (item: OcurrenciaSintoma) => {
    setItemToView(item);
    setViewModalOpen(true);
  };

  const handleEdit = (item: OcurrenciaSintoma) => {
    setItemToEdit(item);
    setFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/sintomas/ocurrencias/${itemToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al borrar');
      
      window.dispatchEvent(new CustomEvent('sintomaGuardado'));
    } catch (err) {
      console.error(err);
      console.error('Error al borrar');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEditSuccess = () => {
    setFormModalOpen(false);
    setItemToEdit(null);
  };

  const handleEditCancel = () => {
    setFormModalOpen(false);
    setItemToEdit(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-3 border-b-2 border-rose-200 pb-4">
        <span className="text-4xl">🩺</span>
        <h1 className="text-3xl font-bold text-slate-800">Registro de Síntomas</h1>
      </div>

      <div className="space-y-6">
        <SintomasTabla onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Borrar Registro"
        description="¿Estás seguro de que quieres borrar este registro de síntoma?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        confirmText="Borrar"
        variant="danger"
        isConfirming={isDeleting}
      />

      <Modal 
        isOpen={viewModalOpen} 
        onClose={() => setViewModalOpen(false)} 
        title="Ver S�ntoma" 
        size="lg" 
        preventClose={false}
        colorTheme={{ 
          titleColor: 'text-rose-900', 
          headerBorder: 'border-rose-100', 
          closeIconHover: 'hover:text-rose-500', 
          modalBorder: 'border-rose-400' 
        }}
      >
        <SintomasForm 
          initialData={itemToView} 
          isReadOnly={true}
          onCancel={() => setViewModalOpen(false)}
        />
      </Modal>

      <Modal 
        isOpen={formModalOpen} 
        onClose={handleEditCancel} 
        title="Editar Síntoma"
        size="lg"
        preventClose={true}
        colorTheme={{ 
          titleColor: 'text-rose-900', 
          headerBorder: 'border-rose-100', 
          closeIconHover: 'hover:text-rose-500', 
          modalBorder: 'border-rose-400' 
        }}
      >
        <SintomasForm 
          initialData={itemToEdit} 
          onSuccess={handleEditSuccess} 
          onCancel={handleEditCancel}
        />
      </Modal>
      
    </div>
  );
};