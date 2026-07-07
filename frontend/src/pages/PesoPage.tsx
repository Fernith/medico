import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PesosTabla } from '../features/peso/PesosTabla';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { type PesoDB, calcularIMC, calcularPesoParaIMC, obtenerColorIMC } from '../utils/pesoCalculations';
import { PesoForm } from '../features/peso/PesoForm';

// Componente para los puntos de colores en la gráfica
const ColoredDot = (props: any) => {
  const { cx, cy, payload } = props;
  const color = payload.trend === 'down' ? '#10b981' : payload.trend === 'up' ? '#ef4444' : '#94a3b8';
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />;
};

export const PesoPage: React.FC = () => {
  const [pesos, setPesos] = useState<PesoDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal Edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pesoToEdit, setPesoToEdit] = useState<PesoDB | null>(null);
  
  // Modal Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pesoToDelete, setPesoToDelete] = useState<string | number | null>(null);

  // Variables base
  const ALTURA_DEFAULT = 180; // En el futuro saldrá de ajustes

  const fetchPesos = async () => {
    try {
      const res = await fetch('/api/pesos');
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: PesoDB, b: PesoDB) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setPesos(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPesos();
    
    // Escuchador del evento global para actualizarse solo (captura Añadir y Modificar)
    const handleRegistro = (e: any) => {
      if (e.detail === 'peso') fetchPesos();
    };
    
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  const chartData = useMemo(() => {
    if (pesos.length === 0) return [];
    
    const cronologico = [...pesos].reverse();
    
    return cronologico.map((p, i) => {
      let trend = 'same';
      if (i > 0) {
        const anterior = cronologico[i - 1].peso;
        if (p.peso < anterior) trend = 'down';
        if (p.peso > anterior) trend = 'up';
      }
      return {
        ...p,
        timestamp: new Date(p.fecha).getTime(),
        trend
      };
    });
  }, [pesos]);

  // Cálculos actuales y límites de IMC
  const ultimoPeso = pesos.length > 0 ? pesos[0].peso : null;
  const imcActual = ultimoPeso ? calcularIMC(ultimoPeso, ALTURA_DEFAULT) : null;
  const infoIMC = imcActual ? obtenerColorIMC(imcActual) : null;
  
  const Sobrepeso = calcularPesoParaIMC(24.9, ALTURA_DEFAULT);
  const BajoPeso = calcularPesoParaIMC(18.5, ALTURA_DEFAULT);
  const ObesidadModerada = calcularPesoParaIMC(29.9, ALTURA_DEFAULT);
  const ObesidadGrave = calcularPesoParaIMC(34.9, ALTURA_DEFAULT);

  // HANDLER ÚNICO: Borrar (Editar se autogestiona en PesoForm)
  const confirmDelete = async () => {
    try {
      await fetch(`/api/pesos/${pesoToDelete}`, { method: 'DELETE' });
      fetchPesos();
      setDeleteModalOpen(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b-2 border-emerald-200 pb-4">
        <span className="text-4xl">⚖️</span>
        <h1 className="text-3xl font-bold text-slate-800">Seguimiento de Peso</h1>
      </div>

      {!isLoading && pesos.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 h-[400px]">
              <h2 className="text-lg font-bold text-slate-700 mb-4">Evolución (kg)</h2>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="timestamp" 
                    type="number" 
                    scale="time"
                    domain={['dataMin', 'dataMax']} 
                    tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                  
                  <ReferenceLine y={ObesidadGrave} stroke="#bf7a02" strokeDasharray="3 3" label={{ position: 'top', value: 'Obesidad Grave', fill: '#bf7a02', fontSize: 10 }} />
                  <ReferenceLine y={ObesidadModerada} stroke="#bfb602" strokeDasharray="3 3" label={{ position: 'top', value: 'Obesidad Moderada', fill: '#bfb602', fontSize: 10 }} />
                  <ReferenceLine y={Sobrepeso} stroke="#67d203" strokeDasharray="3 3" label={{ position: 'top', value: 'Sobrepeso', fill: '#67d203', fontSize: 10 }} />
                  <ReferenceLine y={BajoPeso} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'bottom', value: 'Bajo peso', fill: '#3b82f6', fontSize: 10 }} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#cbd5e1" 
                    strokeWidth={2}
                    dot={<ColoredDot />}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {imcActual && infoIMC && (
              <div className={`p-6 rounded-2xl border flex items-center justify-between ${infoIMC.clases} transition-colors duration-500`}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-80">Índice de Masa Corporal</p>
                  <p className="text-4xl font-black mt-1">{imcActual}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{infoIMC.texto}</p>
                  <p className="text-sm opacity-80 mt-1">Límites sanos: {BajoPeso} - {Sobrepeso} kg</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-emerald-700">Historial</h2>
            <PesosTabla 
              pesos={pesos} 
              onEdit={(p) => { setPesoToEdit(p); setEditModalOpen(true); }}
              onDelete={(id) => { setPesoToDelete(id); setDeleteModalOpen(true); }}
            />
          </div>
        </div>
      )}

      {/* MODAL EDITAR LOCAL REFACTORIZADO */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Peso">
        {pesoToEdit && (
          <PesoForm 
            initialData={pesoToEdit} 
            onSuccess={() => setEditModalOpen(false)} 
            onCancel={() => setEditModalOpen(false)} 
          />
        )}
      </Modal>

      <ConfirmModal 
        isOpen={deleteModalOpen} 
        onCancel={() => setDeleteModalOpen(false)} 
        title="Borrar Registro" 
        description="¿Seguro que quieres borrar este peso? La gráfica se actualizará sola."
        onConfirm={confirmDelete}
        variant="danger"
        confirmText="Borrar"
      />
    </div>
  );
};