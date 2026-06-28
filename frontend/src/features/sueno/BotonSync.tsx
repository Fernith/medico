import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

interface BotonSyncProps {
  onSyncComplete: () => void;
}

export const BotonSync: React.FC<BotonSyncProps> = ({ onSyncComplete }) => {
  const [sincronizando, setSincronizando] = useState(false);

  const solicitarSincronizacion = async () => {
    setSincronizando(true);
    try {
      await api.post('/api/sueno/sync');
      onSyncComplete();
      alert("Sincronización con Google Fit finalizada con éxito.");
    } catch (err) {
      alert("Error al conectar con Google Fit API. Revisa tu autorización.");
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      onClick={solicitarSincronizacion} 
      disabled={sincronizando}
      className="flex items-center gap-2"
    >
      <svg className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.253 8H18" />
      </svg>
      {sincronizando ? 'Sincronizando...' : 'Sincronizar Google Fit'}
    </Button>
  );
};