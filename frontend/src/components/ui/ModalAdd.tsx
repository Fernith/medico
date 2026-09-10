import React, { useState, useEffect } from 'react';
import { Modal, type ModalColorTheme } from './Modal';
import { PesoForm } from '../../features/peso/PesoForm';
import { ReglaForm } from '../../features/regla/ReglaForm';
import { MedicionForm } from '../../features/peso/MedicionForm';
import { HistorialMedicacionForm } from '../../features/medicamentos/HistorialMedicacionForm';
import type { Ciclo } from '../../utils/reglaCalculations';

interface ModalAddProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'peso' | 'medicion' | 'regla' | 'medicacion';

export const ModalAdd: React.FC<ModalAddProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('peso');
  
  // NUEVO ESTADO: Ciclo en curso
  const [cicloActivo, setCicloActivo] = useState<Ciclo | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('peso');
    }
  }, [isOpen]);

  // NUEVO EFECTO: Si abrimos la pestaña Regla, preguntamos al backend si hay ciclo activo
  useEffect(() => {
    if (isOpen && activeTab === 'regla') {
      fetch('/api/ciclos/actual')
        .then(res => {
          if (res.status === 200) return res.json();
          return null;
        })
        .then(data => setCicloActivo(data))
        .catch(console.error);
    } else {
      setCicloActivo(null); // Limpiamos si no estamos en regla
    }
  }, [isOpen, activeTab]);

  const pesoTheme: Partial<ModalColorTheme> = { titleColor: 'text-emerald-900', headerBorder: 'border-emerald-100', closeIconHover: 'hover:text-emerald-500', modalBorder: 'border-emerald-400', };
  const medicionTheme: Partial<ModalColorTheme> = { titleColor: 'text-rose-900', headerBorder: 'border-rose-100', closeIconHover: 'hover:text-rose-500', modalBorder: 'border-rose-400', };
  const reglaTheme: Partial<ModalColorTheme> = { titleColor: 'text-purple-900', headerBorder: 'border-pink-100', closeIconHover: 'hover:text-pink-500', modalBorder: 'border-pink-400', };
  const medicacionTheme: Partial<ModalColorTheme> = { titleColor: 'text-teal-900', headerBorder: 'border-teal-100', closeIconHover: 'hover:text-teal-500', modalBorder: 'border-teal-400' };

  const currentTheme = 
    activeTab === 'peso' ? pesoTheme : 
    activeTab === 'medicion' ? medicionTheme : 
    activeTab === 'regla' ? reglaTheme : 
    medicacionTheme;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Registro" preventClose={true} colorTheme={currentTheme} size='lg'>
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 transition-colors">
        <button onClick={() => setActiveTab('peso')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'peso' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Peso</button>
        <button onClick={() => setActiveTab('medicion')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'medicion' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Medidas</button>
        <button onClick={() => setActiveTab('regla')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'regla' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Regla</button>
        <button onClick={() => setActiveTab('medicacion')} className={`flex-1 min-w-[80px] py-2 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'medicacion' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Medicación</button>
      </div>

      <div className="transition-opacity duration-300">
        {activeTab === 'peso' && <PesoForm onSuccess={onClose} onCancel={onClose} />}
        {activeTab === 'medicion' && <MedicionForm onSuccess={onClose} onCancel={onClose} />}
        {activeTab === 'regla' && <ReglaForm initialData={cicloActivo} onSuccess={onClose} onCancel={onClose} />}
        {activeTab === 'medicacion' && <HistorialMedicacionForm onSuccess={onClose} onCancel={onClose} />}
      </div>
    </Modal>
  );
};