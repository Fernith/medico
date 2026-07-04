import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Ciclo } from '../../utils/reglaCalculations';

interface ReglaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (datos: { fecha_inicio: string; fecha_fin: string | null }) => Promise<void>;
  cicloAEditar: Ciclo | null;
}

export const ReglaFormModal: React.FC<ReglaFormModalProps> = ({ isOpen, onClose, onSave, cicloAEditar }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cicloAEditar) {
      setFechaInicio(cicloAEditar.fecha_inicio.split('T')[0]);
      setFechaFin(cicloAEditar.fecha_fin ? cicloAEditar.fecha_fin.split('T')[0] : '');
    } else {
      setFechaInicio('');
      setFechaFin('');
    }
    setError('');
  }, [cicloAEditar, isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fechaInicio) {
      setError('La fecha de inicio es obligatoria.');
      return;
    }
    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      setError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin.trim() === '' ? null : fechaFin
      });
      onClose();
    } catch (err) {
      setError('Ocurrió un error al guardar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={cicloAEditar ? "Editar Ciclo" : "Añadir Ciclo"}
      size="md"
      preventClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        
        <Input
          type="date"
          label="Inicio del periodo"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          }
        />
        
        <Input
          type="date"
          label="Fin del periodo (Opcional)"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          clearable
          onClear={() => setFechaFin('')}
          helperText="Déjalo en blanco si el periodo sigue en curso."
          className={!fechaFin ? 'border-dashed border-pink-300' : ''}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          }
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button 
            type="button" 
            onClick={onClose} 
            variant="ghost"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            isLoading={isSubmitting}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};