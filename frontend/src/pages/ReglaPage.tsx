import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ReglaBarras } from '../features/regla/ReglaBarras';
import { ReglaTabla } from '../features/regla/ReglaTabla';
import { CalendarioMes } from '../features/regla/CalendarioMes';
import { type Ciclo, generarMapaEstados } from '../utils/reglaCalculations';
import { useAjustes } from '../context/AjustesContext';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { ReglaForm } from '../features/regla/ReglaForm';

export const ReglaPage: React.FC = () => {
  const [vista, setVista] = useState<'mensual' | 'anual'>('mensual');
  const [yearAnual, setYearAnual] = useState<number>(new Date().getFullYear());

  const [isDeleting, setIsDeleting] = useState(false);
  
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del modal de confirmación (Borrar)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cicloIdToDelete, setCicloIdToDelete] = useState<string | null>(null);
  
  // Estados del modal de formulario (Añadir / Editar)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [cicloToEdit, setCicloToEdit] = useState<Ciclo | null>(null);

  const { ajustes } = useAjustes();
  const mediaCiclo = Number(ajustes['duracion_media_ciclo']) || 28;
  const mediaPeriodo = Number(ajustes['duracion_media_periodo']) || 6;

  // --- LÓGICA DE CÁLCULO HISTÓRICO REAL ---
  let mediaCicloReal = mediaCiclo;
  let mediaPeriodoReal = mediaPeriodo;

  if (ciclos.length > 1) {
    const ciclosCompletos = ciclos.filter(c => c.fecha_fin !== null);
    
    if (ciclosCompletos.length > 0) {
      let sumaPeriodos = 0;
      let sumaCiclos = 0;
      let ciclosContados = 0;

      for (let i = 0; i < ciclos.length; i++) {
        const cicloActual = ciclos[i];
        
        if (!cicloActual.fecha_fin) continue;

        const inicio = new Date(cicloActual.fecha_inicio);
        const fin = new Date(cicloActual.fecha_fin);
        
        sumaPeriodos += Math.round((fin.getTime() - inicio.getTime()) / (1000 * 3600 * 24)) + 1;

        if (i > 0) {
          const inicioSiguiente = new Date(ciclos[i - 1].fecha_inicio);
          sumaCiclos += Math.round((inicioSiguiente.getTime() - inicio.getTime()) / (1000 * 3600 * 24));
          ciclosContados++;
        }
      }

      if (ciclosContados > 0) {
        mediaCicloReal = Math.round(sumaCiclos / ciclosContados);
        mediaPeriodoReal = Math.round(sumaPeriodos / ciclosCompletos.length);
      }
    }
  }

  const fetchCiclos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ciclos'); 
      if (!response.ok) throw new Error('Error al cargar los ciclos');
      
      const data = await response.json();
      setCiclos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCiclos();
    
    const handleRegistro = (e: any) => {
      if (e.detail === 'regla') fetchCiclos();
    };
    
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const handleDeleteClick = (id: string) => {
    setCicloIdToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!cicloIdToDelete) return;
    setIsDeleting(true); 
    try {
      const response = await fetch(`/api/ciclos/${cicloIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al borrar el registro');
      
      setCiclos(prev => prev.filter(c => c.id !== cicloIdToDelete));
      setDeleteModalOpen(false);
      setCicloIdToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Hubo un problema al borrar el registro.');
    } finally {
      setIsDeleting(false); 
    }
  };

  const handleEditClick = (ciclo: Ciclo) => {
    setCicloToEdit(ciclo);
    setFormModalOpen(true);
  };

  const hoy = new Date();
  const currentMonth = hoy.getMonth();
  const currentYear = hoy.getFullYear();
  const mapaEstados = generarMapaEstados(ciclos, mediaCiclo, mediaPeriodo, vista === 'anual' ? yearAnual : currentYear);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 border-b-2 border-pink-200 pb-4">
        <span className="text-4xl">🩸</span>
        <h1 className="text-3xl font-bold text-purple-900">Seguimiento del Ciclo</h1>
      </div>

      <div className="flex space-x-2 bg-pink-50 p-1 rounded-lg w-max">
        <button
          onClick={() => setVista('mensual')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            vista === 'mensual' ? 'bg-pink-500 text-white shadow' : 'text-purple-700 hover:bg-pink-100'
          }`}
        >
          Vista Mensual
        </button>
        <button
          onClick={() => setVista('anual')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            vista === 'anual' ? 'bg-pink-500 text-white shadow' : 'text-purple-700 hover:bg-pink-100'
          }`}
        >
          Vista Anual
        </button>
      </div>

      {isLoading && <p className="text-pink-500 animate-pulse font-medium">Cargando registros...</p>}
      {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

      {!isLoading && !error && vista === 'mensual' && (
        <div className="grid grid-cols-1 gap-8">
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-semibold text-pink-700">Duración del ciclo</h2>
            <ReglaBarras ciclos={ciclos} mediaCiclo={mediaCiclo} />
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-pink-700">Historial</h2>
            </div>
            <ReglaTabla ciclos={ciclos} onEdit={handleEditClick} onDelete={handleDeleteClick} />
            <div className="flex gap-4 px-2 text-sm text-pink-400 font-medium justify-end mt-1">
              <p>Promedio real del ciclo: <span className="text-pink-600 font-bold">{mediaCicloReal} días</span></p>
              <p>Promedio real del periodo: <span className="text-pink-600 font-bold">{mediaPeriodoReal} días</span></p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-8 pt-8 border-t border-pink-100">
          {vista === 'mensual' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <CalendarioMes year={currentYear} month={currentMonth} mapaEstados={mapaEstados} isLarge={true} />
              <CalendarioMes year={currentMonth === 11 ? currentYear + 1 : currentYear} month={currentMonth === 11 ? 0 : currentMonth + 1} mapaEstados={mapaEstados} isLarge={true} />
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              
              <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-8 w-max">
                <button 
                  onClick={() => setYearAnual(prev => prev - 1)}
                  disabled={yearAnual <= 2024} // LÍMITE INFERIOR
                  className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                
                <select 
                  value={yearAnual} 
                  onChange={(e) => setYearAnual(Number(e.target.value))}
                  className="bg-slate-100 hover:bg-pink-50 focus:bg-pink-50 font-bold text-slate-500 hover:text-pink-600 focus:ring-2 focus:ring-pink-200 outline-none cursor-pointer rounded-lg py-1 px-2 sm:px-4 text-center transition-all min-w-[90px]"
                >
                  {Array.from({ length: Math.max(1, currentYear - 2024 + 2) }, (_, i) => 2024 + i).reverse().map(y => (
                    <option key={y} value={y} className="text-slate-700">{y}</option>
                  ))}
                </select>

                <button 
                  onClick={() => setYearAnual(prev => prev + 1)}
                  disabled={yearAnual >= currentYear + 1}
                  className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>

                <div className="w-px h-6 bg-slate-200 mx-0.5 sm:mx-1 shrink-0"></div>
                
                <button 
                  onClick={() => setYearAnual(currentYear)} 
                  disabled={yearAnual === currentYear} 
                  className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-pink-500 disabled:text-slate-400 disabled:opacity-50 disabled:hover:bg-transparent shrink-0" 
                  title="Ir al año actual"
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-2 w-full">
                {Array.from({ length: 12 }, (_, mes) => (
                  <CalendarioMes 
                    key={`${yearAnual}-${mes}`} 
                    year={yearAnual} 
                    month={mes} 
                    mapaEstados={mapaEstados} 
                    isLarge={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Borrar Registro"
        description="¿Estás seguro de que quieres borrar este registro? Los cálculos y predicciones se recalcularán automáticamente."
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setCicloIdToDelete(null);
        }}
        confirmText="Borrar"
        variant="danger"
        isConfirming={isDeleting}
      />

      <Modal 
        isOpen={formModalOpen} 
        onClose={() => setFormModalOpen(false)} 
        title={cicloToEdit ? "Editar Ciclo" : "Añadir Ciclo"} 
        size="lg" 
        preventClose={true}
        colorTheme={{ 
          titleColor: 'text-purple-900', 
          headerBorder: 'border-pink-100', 
          closeIconHover: 'hover:text-pink-500', 
          modalBorder: 'border-pink-400' 
        }}
      >
        <ReglaForm 
          initialData={cicloToEdit} 
          onSuccess={() => setFormModalOpen(false)} 
          onCancel={() => setFormModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};