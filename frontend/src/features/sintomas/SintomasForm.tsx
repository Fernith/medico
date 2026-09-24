import React, { useState } from 'react';
import { SintomasAnatomiaMapa, type ZonaSeleccionada } from './SintomasAnatomiaMapa';
import { SintomasOcurrenciaForm, type OcurrenciaData } from './SintomasOcurrenciaForm';
import { Button } from '../../components/ui/Button';

import { CATALOGO_ANATOMIA } from '../../utils/anatomia';

interface Props {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  isReadOnly?: boolean;
}

export const SintomasForm: React.FC<Props> = ({ initialData, onSuccess, onCancel, isReadOnly }) => {
  // Inicializamos las zonas seleccionadas desde initialData si existe
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<ZonaSeleccionada[]>(() => {
    if (initialData?.localizaciones) {
      return initialData.localizaciones.map((loc: any) => ({
        localizacion_id: loc.localizacion_id,
        nombre: CATALOGO_ANATOMIA.find(a => a.id === loc.localizacion_id)?.nombre || loc.localizacion_id,
        es_irradiado: loc.es_irradiado,
        lado: loc.lado ? (loc.lado.charAt(0).toUpperCase() + loc.lado.slice(1)) : null,
      }));
    }
    return [];
  });
  
  const [ocurrenciaData, setOcurrenciaData] = useState<OcurrenciaData | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGuardar = async () => {
    if (!ocurrenciaData?.sintoma_id) return;
    
    setIsSubmitting(true);
    try {
      const { apiFetch } = await import('../../api/client');
      
      const payload = {
        ...ocurrenciaData,
        caracteristica: ocurrenciaData.caracteristica || null,
        frecuencia: ocurrenciaData.frecuencia || null,
        notas: ocurrenciaData.notas || null,
        valor_registro: ocurrenciaData.valor_registro || null,
        localizaciones: zonasSeleccionadas.map(z => ({
          localizacion_id: z.localizacion_id,
          es_irradiado: z.es_irradiado,
          lado: z.lado ? z.lado.toLowerCase() : null,
        }))
      };

      const url = initialData 
        ? `/api/sintomas/ocurrencias/${initialData.id}` 
        : '/api/sintomas/ocurrencias';
        
      const method = initialData ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method: method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error al guardar el síntoma');
      }

      window.dispatchEvent(new CustomEvent('sintomaGuardado'));
      
      if (onSuccess) {
        onSuccess();
      } else {
        alert('¡Síntoma guardado correctamente!');
      }
      
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
        
        <SintomasAnatomiaMapa 
          onSelectionChange={setZonasSeleccionadas} 
          initialSelection={zonasSeleccionadas}
          isReadOnly={isReadOnly} 
        />
      </div>

      {/* 2. MÓDULO DE DATOS: CAMPOS DEL FORMULARIO */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-2">Detalles de la Ocurrencia</h2>
        <p className="text-sm text-slate-500 mb-6">
          Registra cuándo empezó y con qué intensidad.
        </p>
        
        <SintomasOcurrenciaForm 
          onDataChange={setOcurrenciaData} 
          zonasSeleccionadas={zonasSeleccionadas}
          initialData={initialData}
          isReadOnly={isReadOnly}
        />
      </div>

      {/* 3. BOTONES */}
      <div className="flex justify-end pt-4 gap-3">
        {isReadOnly ? (
          <Button 
            onClick={onCancel}
            className="w-full sm:w-auto text-lg px-8 py-4 rounded-xl shadow-lg"
          >
            Salir
          </Button>
        ) : (
          <>
            {onCancel && (
              <Button 
                onClick={onCancel}
                variant="ghost"
                disabled={isSubmitting}
                className="w-full sm:w-auto text-lg px-8 py-4 rounded-xl"
              >
                Cancelar
              </Button>
            )}
            <Button 
              onClick={handleGuardar}
              disabled={!ocurrenciaData?.sintoma_id || isSubmitting}
              className="w-full sm:w-auto text-lg px-8 py-4 rounded-xl shadow-lg"
            >
              {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar Registro' : 'Guardar Registro')}
            </Button>
          </>
        )}
      </div>

    </div>
  );
};
