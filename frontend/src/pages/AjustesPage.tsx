import React, { useState } from 'react';
import { useAjustes } from '../context/AjustesContext';
import { AjustesParametrosRegla } from '../features/ajustes/AjustesParametrosRegla';
import { AjusteVisibilidadRegla } from '../features/ajustes/AjusteVisibilidadRegla';

export const AjustesPage: React.FC = () => {
  const { ajustes, actualizarAjuste } = useAjustes();
  const [isSaving, setIsSaving] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  // Extraemos los valores del Record, parseando a su tipo correspondiente y aplicando valores por defecto
  const mostrarRegla = ajustes['mostrar_regla'] === 'true';
  const duracionMediaCiclo = Number(ajustes['duracion_media_ciclo']) || 28;
  const duracionMediaPeriodo = Number(ajustes['duracion_media_periodo']) || 6;

  const handleSaveParametrosRegla = async (nuevoCiclo: number, nuevoPeriodo: number) => {
    setIsSaving(true);
    setMensajeConfirmacion('');
    try {
      await actualizarAjuste('duracion_media_ciclo', nuevoCiclo.toString());
      await actualizarAjuste('duracion_media_periodo', nuevoPeriodo.toString());
      
      setMensajeConfirmacion('¡Parámetros actualizados correctamente!');
      setTimeout(() => setMensajeConfirmacion(''), 3000);
    } catch (error) {
      alert("Ocurrió un error al guardar los parámetros del ciclo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="border-b-2 border-pink-200 pb-4">
        <h1 className="text-3xl font-bold text-purple-900">Ajustes</h1>
        <p className="text-gray-500 mt-2">Configura tus preferencias de la aplicación.</p>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-sm border border-pink-100">
        <AjusteVisibilidadRegla />
      </section>

      <AjustesParametrosRegla 
        isVisible={mostrarRegla}
        duracionCicloActual={duracionMediaCiclo}
        duracionPeriodoActual={duracionMediaPeriodo}
        onSave={handleSaveParametrosRegla}
      />

      {isSaving && <p className="text-pink-500 font-medium text-center">Guardando...</p>}
      {mensajeConfirmacion && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center font-medium">
          {mensajeConfirmacion}
        </div>
      )}
    </div>
  );
};