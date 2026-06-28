import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

interface PesoFormProps {
  onSuccess: () => void;
}

export const PesoForm: React.FC<PesoFormProps> = ({ onSuccess }) => {
  const [peso, setPeso] = useState('');
  const [comido, setComido] = useState(false);
  const [momento, setMomento] = useState<'día' | 'noche'>('día');
  const [cargando, setCargando] = useState(false);

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peso) return;
    setCargando(true);

    try {
      await api.post('/api/pesos', {
        fecha: new Date().toISOString(),
        peso_kg: parseFloat(peso),
        comido_recientemente: comido,
        momento_dia: momento,
      });
      setPeso('');
      onSuccess();
    } catch (err) {
      alert("Error al guardar el peso");
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={enviarFormulario} className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm flex flex-col gap-4">
      <h3 className="text-base font-bold text-slate-800">Añadir Control de Peso</h3>
      
      <Input 
        label="Peso en Kilogramos (kg)" 
        type="number" 
        step="0.01" 
        value={peso} 
        onChange={(e) => setPeso(e.target.value)} 
        placeholder="ej. 74.5"
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Momento del Día</label>
        <select 
          value={momento} 
          onChange={(e) => setMomento(e.target.value as 'día' | 'noche')}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="día">Día (Mañana)</option>
          <option value="noche">Noche</option>
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer mt-2">
        <input 
          type="checkbox" 
          checked={comido} 
          onChange={(e) => setComido(e.target.checked)}
          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
        />
        <span className="text-sm text-slate-600">¿He comido recientemente?</span>
      </label>

      <Button type="submit" disabled={cargando} className="mt-2">
        {cargando ? 'Guardando...' : 'Registrar Peso'}
      </Button>
    </form>
  );
};