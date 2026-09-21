import React, { useState } from 'react';
import { SintomasAnatomiaMapa, type ZonaSeleccionada } from './SintomasAnatomiaMapa';
import { SintomasOcurrenciaForm, type OcurrenciaData } from './SintomasOcurrenciaForm';
import { Button } from '../../components/ui/Button';

export const SintomasForm: React.FC = () => {
  // Aquí almacenaremos el array final con los clics procesados (Foco/Irradiado/Lado)
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<ZonaSeleccionada[]>([]);
  const [ocurrenciaData, setOcurrenciaData] = useState<OcurrenciaData | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGuardar = async () => {
    if (!ocurrenciaData?.sintoma_id) return;
    
    setIsSubmitting(true);
    try {
      const { apiFetch } = await import('../../api/client');
      
      const payload = {
        ...ocurrenciaData,
        localizaciones: zonasSeleccionadas.map(z => ({
          localizacion_id: z.localizacion_id,
          es_irradiado: z.es_irradiado,
          // Convertir a minúsculas para coincidir con el snake_case del LadoEnum de Rust
          lado: z.lado ? z.lado.toLowerCase() : null,
        }))
      };

      const res = await apiFetch('/api/sintomas/ocurrencias', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error al guardar el síntoma');
      }

      alert('¡Síntoma guardado correctamente!');
      // Aquí se podría redirigir o limpiar el formulario
      
    } catch (error) {
      console.error(error);
      alert('Hubo un problema al guardar el síntoma.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* 1. MÓDULO VISUAL: MAPA ANATÓMICO */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-rose-100">
        <h2 className="text-xl font-black text-slate-800 mb-2">Localización del Síntoma</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Selecciona la zona afectada. Haz <b>un clic</b> para marcar el foco principal, y <b>dos clics</b> para indicar que el dolor se irradia a esa zona.
        </p>
        
        <SintomasAnatomiaMapa onSelectionChange={setZonasSeleccionadas} />
      </div>

      {/* 2. MÓDULO DE DATOS: CAMPOS DEL FORMULARIO */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-2">Detalles de la Ocurrencia</h2>
        <p className="text-sm text-slate-500 mb-6">
          Registra cuándo empezó y con qué intensidad.
        </p>
        
        <SintomasOcurrenciaForm onDataChange={setOcurrenciaData} />
      </div>

      {/* 3. BOTÓN DE GUARDADO */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleGuardar}
          disabled={!ocurrenciaData?.sintoma_id || isSubmitting}
          className="w-full sm:w-auto text-lg px-8 py-4 rounded-xl shadow-lg"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
        </Button>
      </div>

    </div>
  );
};