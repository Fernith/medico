import { apiFetch } from '../../api/client';
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
      <div className="sticky bottom-[-1.25rem] bg-white p-5 border-t border-slate-100 flex gap-4 -mx-5 -mb-5 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        {isReadOnly ? (
          <Button 
            onClick={onCancel}
            className="flex-1 py-3"
          >
            Salir
          </Button>
        ) : (
          <>
            {onCancel && (
              <Button 
                variant="ghost"
                onClick={onCancel}
                className="flex-1 py-3"
              >
                Cancelar
              </Button>
            )}
            <Button
              type='submit'
              onClick={handleGuardar}
              disabled={isSubmitting || !ocurrenciaData?.sintoma_id}
              className="flex-1 py-3"
            >
              {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar Registro' : 'Guardar')}
            </Button>
          </>
        )}
      </div>

    </div>
  );
};
