import React, { useState, useEffect } from 'react';
import { ReglaBarras } from '../features/regla/ReglaBarras';
import { ReglaTabla } from '../features/regla/ReglaTabla';
import { CalendarioMes } from '../features/regla/CalendarioMes';
import { type Ciclo, generarMapaEstados } from '../utils/reglaCalculations';
import { useAjustes } from '../context/AjustesContext';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ReglaFormModal } from '../features/regla/ReglaFormModal';

export const ReglaPage: React.FC = () => {
  const [vista, setVista] = useState<'mensual' | 'anual'>('mensual');
  const [yearAnual, setYearAnual] = useState<number>(new Date().getFullYear());
  
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

  useEffect(() => {
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
    fetchCiclos();
  }, []);

  // ---- MANEJADORES DE BORRADO ----
  const handleDeleteClick = (id: string) => {
    setCicloIdToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!cicloIdToDelete) return;
    
    try {
      const response = await fetch(`/api/ciclos/${cicloIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al borrar el registro');
      
      setCiclos(prev => prev.filter(c => c.id !== cicloIdToDelete));
      setDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Hubo un problema al borrar el registro.');
    }
  };

  // ---- MANEJADORES DE FORMULARIO (AÑADIR / EDITAR) ----
  const handleEditClick = (ciclo: Ciclo) => {
    setCicloToEdit(ciclo);
    setFormModalOpen(true);
  };

  const handleSaveCiclo = async (datos: { fecha_inicio: string; fecha_fin: string | null }) => {
    if (cicloToEdit) {
      // Petición de actualización
      const response = await fetch(`/api/ciclos/${cicloToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      
      if (!response.ok) throw new Error('Error al actualizar');
      const updatedCiclo = await response.json();

      setCiclos(prev => {
        const nuevaLista = prev.map(c => c.id === updatedCiclo.id ? updatedCiclo : c);
        return nuevaLista.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
      });
    } else {
      // Petición de creación
      const response = await fetch(`/api/ciclos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      
      if (!response.ok) throw new Error('Error al crear');
      const newCiclo = await response.json();
      
      setCiclos(prev => {
        const nuevaLista = [...prev, newCiclo];
        return nuevaLista.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
      });
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-semibold text-pink-700">Duración del ciclo</h2>
            <ReglaBarras ciclos={ciclos} mediaCiclo={mediaCiclo} />
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-pink-700">Historial</h2>
              <button 
                onClick={() => { setCicloToEdit(null); setFormModalOpen(true); }}
                className="text-sm font-medium text-pink-600 hover:text-pink-800 transition-colors bg-pink-50 px-3 py-1 rounded-lg"
              >
                + Añadir manual
              </button>
            </div>
            <ReglaTabla ciclos={ciclos} onEdit={handleEditClick} onDelete={handleDeleteClick} />
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-8 pt-8 border-t border-pink-100">
          {vista === 'mensual' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <CalendarioMes 
                year={currentYear} 
                month={currentMonth} 
                mapaEstados={mapaEstados} 
                isLarge={true} 
              />
              <CalendarioMes 
                year={currentMonth === 11 ? currentYear + 1 : currentYear} 
                month={currentMonth === 11 ? 0 : currentMonth + 1} 
                mapaEstados={mapaEstados} 
                isLarge={true} 
              />
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              {/* Selector de año (Se queda igual que antes) */}
              <div className="mb-8 relative inline-flex items-center bg-white rounded-xl shadow-sm border border-pink-200 hover:border-pink-300 transition-colors focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-pink-500">
                <div className="pl-4 pr-2 text-pink-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <select 
                  value={yearAnual}
                  onChange={(e) => setYearAnual(Number(e.target.value))}
                  className="appearance-none bg-transparent text-purple-900 font-bold text-lg py-3 pl-2 pr-10 focus:outline-none cursor-pointer w-32"
                >
                  {Array.from({ length: Math.max(1, currentYear - 2025 + 1) }, (_, i) => 2025 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-pink-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>

              {/* Grid 12 Meses - Corregido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-2 w-full">
                {Array.from({ length: 12 }, (_, mes) => (
                  // Quitamos el div con scale-[0.95] y renderizamos CalendarioMes directamente
                  // Esto permite que actúe como un elemento real del grid y estire su altura
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
      />

      <ReglaFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSaveCiclo}
        cicloAEditar={cicloToEdit}
      />
    </div>
  );
};