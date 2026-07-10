import React, { useState, useEffect, useMemo } from 'react';
import { PesosTabla } from '../features/peso/PesosTabla';
import { MedidasTabla } from '../features/peso/MedidasTabla';
import { PesoGrafica } from '../features/peso/PesoGrafica';
import { MedidasGrafica } from '../features/peso/MedidasGrafica';
import { IMCWidget } from '../features/peso/IMCWidget';
import { MedidasIndicadoresWidget } from '../features/peso/MedidasIndicadoresWidget';
import { type PesoDB } from '../utils/pesoCalculations';
import { type MedicionDB } from '../utils/medicionCalculations';
import { Select } from '../components/ui/Select';

export const PesoPage: React.FC = () => {
  const [vista, setVista] = useState<'peso' | 'medidas'>('peso');
  const [rangoTiempo, setRangoTiempo] = useState<string>('6M');
  const [isLoading, setIsLoading] = useState(true);
  
  const [pesos, setPesos] = useState<PesoDB[]>([]);
  const [mediciones, setMediciones] = useState<MedicionDB[]>([]);
  const [usuario, setUsuario] = useState({ altura: 180, sexo: 'Masculino' as 'Masculino' | 'Femenino' });

  const fetchAllData = async () => {
    try {
      const [resUsu, resPes, resMed] = await Promise.all([
        fetch('/api/usuario'),
        fetch('/api/pesos'),
        fetch('/api/mediciones')
      ]);

      if (resUsu.ok) setUsuario(await resUsu.json());
      if (resPes.ok) setPesos((await resPes.json()).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      if (resMed.ok) setMediciones((await resMed.json()).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const handleRegistro = (e: any) => {
      if (e.detail === 'peso' || e.detail === 'medicion') fetchAllData();
    };
    window.addEventListener('registroAgregado', handleRegistro);
    return () => window.removeEventListener('registroAgregado', handleRegistro);
  }, []);

  // --- LÓGICA DE FILTRADO POR TIEMPO (Solo para las gráficas) ---
  const filtrarPorTiempo = <T extends { fecha: string }>(data: T[], rango: string): T[] => {
    if (rango === 'ALL') return data;
    
    const limite = new Date();
    if (rango === '3M') limite.setMonth(limite.getMonth() - 3);
    else if (rango === '6M') limite.setMonth(limite.getMonth() - 6);
    else if (rango === '1Y') limite.setFullYear(limite.getFullYear() - 1);
    else if (rango === '3Y') limite.setFullYear(limite.getFullYear() - 3);
    else if (rango === '5Y') limite.setFullYear(limite.getFullYear() - 5);

    return data.filter(item => new Date(item.fecha) >= limite);
  };

  const pesosGrafica = useMemo(() => filtrarPorTiempo(pesos, rangoTiempo), [pesos, rangoTiempo]);
  const medicionesGrafica = useMemo(() => filtrarPorTiempo(mediciones, rangoTiempo), [mediciones, rangoTiempo]);

  // Los widgets siempre usarán el último dato real registrado, independientemente del zoom de la gráfica
  const ultimoPeso = pesos.length > 0 ? pesos[0].peso : null;
  const ultimaMedida = mediciones.length > 0 ? mediciones[0] : { cm_cintura: null, cm_cadera: null };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center gap-3 border-b-2 border-emerald-200 pb-4">
        <span className="text-4xl">⚖️</span>
        <h1 className="text-3xl font-bold text-slate-800">Seguimiento Físico</h1>
      </div>

      {/* CONTROLES SUPERIORES: NAVEGACIÓN Y FILTROS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg w-max">
          <button
            onClick={() => setVista('peso')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              vista === 'peso' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            Peso
          </button>
          <button
            onClick={() => setVista('medidas')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              vista === 'medidas' ? 'bg-rose-500 text-white shadow' : 'text-slate-500 hover:text-rose-700'
            }`}
          >
            Medidas
          </button>
        </div>

        {/* SELECTOR DE TIEMPO (Usa un tema neutro para quedar bien tanto en Peso como Medidas) */}
        <div className="flex items-center gap-2 z-10">
          <span className="text-sm font-semibold text-slate-500 hidden sm:block">Ver:</span>
          <Select 
            value={rangoTiempo}
            onChange={(val) => setRangoTiempo(val)}
            className="w-48 sm:w-56"
            options={[
              { value: '3M', label: 'Últimos 3 meses' },
              { value: '6M', label: 'Últimos 6 meses' },
              { value: '1Y', label: 'Último año' },
              { value: '3Y', label: 'Últimos 3 años' },
              { value: '5Y', label: 'Últimos 5 años' },
              { value: 'ALL', label: 'Histórico completo' }
            ]}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            colorTheme={{
              borderNormal: 'border-slate-200',
              borderActive: 'border-slate-400 ring-4 ring-slate-50',
              borderHover: 'hover:border-slate-300 hover:shadow-sm',
              textSelected: 'text-slate-700',
              iconColor: 'text-slate-400',
              optionSelectedBg: 'bg-slate-100',
              optionSelectedText: 'text-slate-800',
              optionHoverBg: 'hover:bg-slate-50',
              optionHoverText: 'hover:text-slate-800',
              checkIcon: 'text-slate-500'
            }}
          />
        </div>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 gap-8">
          
          {/* SECCIÓN SUPERIOR DINÁMICA */}
          <div className="space-y-6">
            {vista === 'peso' ? (
              <>
                {/* Le pasamos a la gráfica solo el array filtrado por tiempo */}
                <PesoGrafica data={pesosGrafica} altura={usuario.altura} />
                <IMCWidget pesoActual={ultimoPeso} altura={usuario.altura} />
              </>
            ) : (
              <>
                <MedidasGrafica data={medicionesGrafica} altura={usuario.altura} sexo={usuario.sexo} />
                <MedidasIndicadoresWidget 
                  cintura={ultimaMedida.cm_cintura} 
                  cadera={ultimaMedida.cm_cadera} 
                  altura={usuario.altura} 
                  sexo={usuario.sexo} 
                />
              </>
            )}
          </div>

          {/* SECCIÓN INFERIOR FIJA (Tablas con histórico intacto) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-4 pt-8 border-t border-slate-100">
            {/* Le pasamos el array original a las tablas para que siempre puedas ver o borrar datos viejos */}
            <PesosTabla pesos={pesos} />
            <MedidasTabla mediciones={mediciones} />
          </div>

        </div>
      )}
    </div>
  );
};