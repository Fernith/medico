import React, { useState, useEffect } from 'react';
import { Activity, Clock, Calendar, X, ArrowUpCircle, ArrowDownCircle, Thermometer, Plus, Minus } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

// Tipos que reflejan la base de datos
export type ReglaMedicion = 'escala_1_10' | 'grados_celsius' | 'presencia_booleana' | 'texto_libre' | 'cualitativa_3' | 'conteo_episodios';

export interface Sintoma {
  id: string;
  nombre: string;
  categoria: string;
  regla_medicion: ReglaMedicion;
}

export type Caracteristica = 'punzante' | 'opresivo' | 'urente_ardor' | 'sordo' | 'colico' | 'electrico' | 'hormigueo' | 'pesadez' | 'otro';
export type Frecuencia = 'unico_episodio' | 'intermitente' | 'constante';

export interface Modificador {
  factor: string;
  efecto: 'alivia' | 'empeora';
}

export interface OcurrenciaData {
  sintoma_id: string;
  fecha_inicio: string; // ISO 8601 (incluye fecha y hora)
  valor_registro: string;
  caracteristica?: Caracteristica | '';
  frecuencia?: Frecuencia | '';
  modificadores: Modificador[];
  notas: string;
}

import { type ZonaSeleccionada } from './SintomasAnatomiaMapa';
import { getCategoriasParaZonas } from '../../utils/anatomia';

interface Props {
  onDataChange: (data: OcurrenciaData) => void;
  zonasSeleccionadas: ZonaSeleccionada[];
  initialData?: any;
  isReadOnly?: boolean;
}

const CARACTERISTICAS_OPCIONES = [
  { value: 'punzante', label: 'Punzante (Como agujas)' },
  { value: 'opresivo', label: 'Opresivo (Sensación de peso)' },
  { value: 'urente_ardor', label: 'Urente (Ardor/Quemazón)' },
  { value: 'sordo', label: 'Sordo (Leve pero continuo)' },
  { value: 'colico', label: 'Cólico (Retortijón)' },
  { value: 'electrico', label: 'Eléctrico (Calambre)' },
  { value: 'hormigueo', label: 'Hormigueo / Adormecimiento' },
  { value: 'pesadez', label: 'Pesadez' },
  { value: 'otro', label: 'Otro' },
];

const FRECUENCIA_OPCIONES = [
  { value: 'unico_episodio', label: 'Único Episodio' },
  { value: 'intermitente', label: 'Intermitente (Va y viene)' },
  { value: 'constante', label: 'Constante (No cesa)' },
];

const SUGERENCIAS = [
  "En reposo", "Al moverse", "Al despertar", "Al acostarse",
  "Después de comer", "Con el calor", "Con el frío",
  "Al presionar la zona", "Con estiramientos", "Con medicación habitual"
];

export const SintomasOcurrenciaForm: React.FC<Props> = ({ onDataChange, zonasSeleccionadas, initialData, isReadOnly }) => {
  const [catalogo, setCatalogo] = useState<Sintoma[]>([]);
  
  useEffect(() => {
    import('../../api/client').then(({ apiFetch }) => {
      apiFetch('/api/sintomas/catalogo')
        .then(res => res.json())
        .then(data => setCatalogo(data))
        .catch(err => console.error("Error fetching sintomas", err));
    });
  }, []);

  const [localDate, setLocalDate] = useState(() => {
    if (initialData?.fecha_inicio) return initialData.fecha_inicio.split('T')[0];
    return new Date().toISOString().split('T')[0];
  });
  
  const [localTime, setLocalTime] = useState(() => {
    if (initialData?.fecha_inicio) return initialData.fecha_inicio.split('T')[1].substring(0, 5);
    return new Date().toTimeString().split(' ')[0].substring(0, 5);
  });
  
  const [data, setData] = useState<OcurrenciaData>(() => {
    if (initialData) {
      return {
        sintoma_id: initialData.sintoma_id,
        fecha_inicio: initialData.fecha_inicio,
        valor_registro: initialData.valor_registro || '',
        caracteristica: initialData.caracteristica || '',
        frecuencia: initialData.frecuencia || '',
        modificadores: initialData.modificadores || [],
        notas: initialData.notas || '',
      };
    }
    return {
      sintoma_id: '',
      fecha_inicio: new Date().toISOString(),
      valor_registro: '',
      caracteristica: '',
      frecuencia: '',
      modificadores: [],
      notas: '',
    };
  });

  const categoriasPermitidas = getCategoriasParaZonas(zonasSeleccionadas.map(z => z.localizacion_id));
  const sintomasFiltrados = catalogo.filter(s => categoriasPermitidas.includes(s.categoria));

  const [nuevoModificador, setNuevoModificador] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);

  const sintomaSeleccionado = catalogo.find(s => s.id === data.sintoma_id);

  // Sincronizar localDate y localTime en la ISO final de fecha_inicio sin usar useEffect
  const handleDateTimeChange = (newDate: string, newTime: string) => {
    setLocalDate(newDate);
    setLocalTime(newTime);
    if (newDate && newTime) {
      try {
        const isoString = new Date(`${newDate}T${newTime}:00`).toISOString();
        setData(prev => ({ ...prev, fecha_inicio: isoString }));
      } catch {
        // Ignorar si la fecha no es válida momentáneamente
      }
    }
  };

  useEffect(() => {
    onDataChange(data);
  }, [data, onDataChange]);

  const handleChange = (field: keyof OcurrenciaData, value: string) => {
    setData(prev => {
      const next = { ...prev, [field]: value };
      // Aplicar valores por defecto según la regla de medición
      if (field === 'sintoma_id') {
        const sintomaInfo = catalogo.find(s => s.id === value);
        if (sintomaInfo) {
          if (sintomaInfo.regla_medicion === 'escala_1_10' || sintomaInfo.regla_medicion === 'cualitativa_3') {
            next.valor_registro = '1';
          } else if (sintomaInfo.regla_medicion === 'grados_celsius' || sintomaInfo.regla_medicion === 'conteo_episodios') {
            next.valor_registro = '38.0';
          } else {
            next.valor_registro = '';
          }
        } else {
          next.valor_registro = '';
        }
      }
      return next;
    });
  };

  const agregarModificador = (efecto: 'alivia' | 'empeora') => {
    if (!nuevoModificador.trim()) return;
    setData(prev => ({
      ...prev,
      modificadores: [...prev.modificadores, { factor: nuevoModificador.trim(), efecto }]
    }));
    setNuevoModificador('');
  };

  const eliminarModificador = (index: number) => {
    setData(prev => ({
      ...prev,
      modificadores: prev.modificadores.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className={`flex flex-col gap-6 ${isReadOnly ? 'opacity-95' : ''}`}>
      
      {/* 1. SELECCIÓN DE SÍNTOMA Y FECHA */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
        
        {/* FECHA Y HORA (AHORA ARRIBA) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <Input
            disabled={isReadOnly}
            type="date"
            label="Fecha de inicio"
            icon={<Calendar className="w-4 h-4" />}
            value={localDate}
            onChange={(e) => handleDateTimeChange(e.target.value, localTime)}
          />
          <Input
            disabled={isReadOnly}
            type="time"
            label="Hora de inicio"
            icon={<Clock className="w-4 h-4" />}
            value={localTime}
            onChange={(e) => handleDateTimeChange(localDate, e.target.value)}
          />
        </div>

        {/* CATÁLOGO MAESTRO */}
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mt-2">
          <Activity className="w-4 h-4 text-indigo-500" /> Identificación del Síntoma
        </h3>
        <Select
          disabled={isReadOnly}
          label="Catálogo de Síntomas"
          options={sintomasFiltrados.map(s => ({ value: s.id, label: s.nombre }))}
          searchable={true}
          value={data.sintoma_id}
          onChange={(v: string) => handleChange('sintoma_id', v)}
          placeholder="Selecciona el síntoma principal..."
        />
        
      </div>

      {/* 2. REGLA DE MEDICIÓN (Dinámico) */}
      {sintomaSeleccionado && (
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-bold text-indigo-900 text-sm mb-4">Medición ({sintomaSeleccionado.nombre})</h3>
          
                    {sintomaSeleccionado.regla_medicion === 'cualitativa_3' && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-indigo-800">
                Intensidad: <span className="text-xl text-indigo-600">{data.valor_registro === '1' ? 'Leve' : data.valor_registro === '2' ? 'Moderado' : 'Grave'}</span>
              </label>
              <input 
                type="range" 
                min="1" max="3" step="1"
                value={data.valor_registro || '1'}
                onChange={(e) => handleChange('valor_registro', e.target.value)}
                disabled={isReadOnly}
                className="w-full accent-indigo-600 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-indigo-600 font-medium">
                <span>Leve (1)</span>
                <span>Moderado (2)</span>
                <span>Grave (3)</span>
              </div>
            </div>
          )}

          {sintomaSeleccionado.regla_medicion === 'escala_1_10' && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-indigo-800">
                Intensidad: <span className="text-xl text-indigo-600">{data.valor_registro || '0'}</span> / 10
              </label>
              <input 
                disabled={isReadOnly}
                type="range" 
                min="1" max="10" step="1"
                value={data.valor_registro || '1'}
                onChange={(e) => handleChange('valor_registro', e.target.value)}
                className="w-full accent-indigo-600 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-indigo-600 font-medium">
                <span>Leve (1)</span>
                <span>Moderado (5)</span>
                <span>Insoportable (10)</span>
              </div>
            </div>
          )}

                    {sintomaSeleccionado.regla_medicion === 'conteo_episodios' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 pl-1">Número de episodios</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(data.valor_registro || '1', 10);
                    if (!isNaN(current) && current > 0) handleChange('valor_registro', (current - 1).toString());
                  }}
                  disabled={isReadOnly}
                  className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 p-3 rounded-xl shadow-sm transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <Input
                    type="number"
                    step="1"
                    icon={<Activity className="w-4 h-4" />}
                    value={data.valor_registro}
                    onChange={(e) => handleChange('valor_registro', e.target.value)}
                    placeholder="Ej: 3"
                    disabled={isReadOnly}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(data.valor_registro || '1', 10);
                    if (!isNaN(current)) handleChange('valor_registro', (current + 1).toString());
                  }}
                  disabled={isReadOnly}
                  className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 p-3 rounded-xl shadow-sm transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {sintomaSeleccionado.regla_medicion === 'grados_celsius' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 pl-1">Temperatura (°C)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => {
                    const current = parseFloat(data.valor_registro || '38.0');
                    if (!isNaN(current)) handleChange('valor_registro', (current - 0.1).toFixed(1));
                  }}
                  className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 p-3 rounded-xl shadow-sm transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <Input
            disabled={isReadOnly}
                    type="number"
                    step="0.1"
                    icon={<Thermometer className="w-4 h-4" />}
                    value={data.valor_registro}
                    onChange={(e) => handleChange('valor_registro', e.target.value)}
                    placeholder="Ej: 38.5"
                  />
                </div>
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => {
                    const current = parseFloat(data.valor_registro || '38.0');
                    if (!isNaN(current)) handleChange('valor_registro', (current + 0.1).toFixed(1));
                  }}
                  className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 p-3 rounded-xl shadow-sm transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {sintomaSeleccionado.regla_medicion === 'presencia_booleana' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors">
                <input 
                  disabled={isReadOnly}
                  type="radio" 
                  name="presencia" 
                  checked={data.valor_registro === 'true'}
                  onChange={() => handleChange('valor_registro', 'true')}
                  className="accent-indigo-600"
                />
                <span className="text-sm font-bold text-indigo-900">Presente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors">
                <input 
                  disabled={isReadOnly}
                  type="radio" 
                  name="presencia" 
                  checked={data.valor_registro === 'false'}
                  onChange={() => handleChange('valor_registro', 'false')}
                  className="accent-indigo-600"
                />
                <span className="text-sm font-bold text-indigo-900">Ausente</span>
              </label>
            </div>
          )}

          {sintomaSeleccionado.regla_medicion === 'texto_libre' && (
            <Input
            disabled={isReadOnly}
              label="Descripción de la medida"
              value={data.valor_registro}
              onChange={(e) => handleChange('valor_registro', e.target.value)}
              placeholder="Escribe cómo medirlo..."
            />
          )}
        </div>
      )}

      {/* 3. DETALLES CLÍNICOS */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
        <h3 className="font-bold text-slate-800 text-sm">Detalles Clínicos (Opcional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
          disabled={isReadOnly}
            label="Característica"
            options={CARACTERISTICAS_OPCIONES}
            value={data.caracteristica}
            onChange={(v: string) => handleChange('caracteristica', v)}
            placeholder="¿Cómo se siente?"
            clearable
          />
          <Select
          disabled={isReadOnly}
            label="Frecuencia"
            options={FRECUENCIA_OPCIONES}
            value={data.frecuencia}
            onChange={(v: string) => handleChange('frecuencia', v)}
            placeholder="¿Cada cuánto ocurre?"
            clearable
          />
        </div>

        <div className="mt-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">Modificadores</label>
          <p className="text-xs text-slate-500 mb-3">Añade qué cosas alivian o empeoran el síntoma. Puedes escribir o elegir de la lista.</p>
          
          {/* COMBOBOX DE SUGERENCIAS */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1 relative">
              <Input
            disabled={isReadOnly}
                placeholder="Ej: Masticar"
                value={nuevoModificador}
                onChange={(e) => {
                  setNuevoModificador(e.target.value);
                  setShowSugerencias(true);
                }}
                onFocus={() => setShowSugerencias(true)}
                onBlur={() => {
                  // Pequeño delay para permitir que el click en la sugerencia se procese
                  setTimeout(() => setShowSugerencias(false), 200);
                }}
              />
              
              {showSugerencias && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
                  {SUGERENCIAS.filter(s => s.toLowerCase().includes(nuevoModificador.toLowerCase())).length > 0 ? (
                    <ul className="py-1">
                      {SUGERENCIAS
                        .filter(s => s.toLowerCase().includes(nuevoModificador.toLowerCase()))
                        .map((sug, i) => (
                          <li
                            key={i}
                            onMouseDown={(e) => {
                              // onMouseDown ocurre antes que onBlur
                              e.preventDefault();
                              setNuevoModificador(sug);
                              setShowSugerencias(false);
                            }}
                            className="px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer transition-colors"
                          >
                            {sug}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      Pulsa Alivia/Empeora para añadir "{nuevoModificador}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => agregarModificador('alivia')}
                disabled={isReadOnly || !nuevoModificador.trim()}
                className="flex-1 sm:flex-none justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-xl flex items-center gap-1 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDownCircle className="w-4 h-4" /> Alivia
              </button>
              <button
                type="button"
                onClick={() => agregarModificador('empeora')}
                disabled={isReadOnly || !nuevoModificador.trim()}
                className="flex-1 sm:flex-none justify-center bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-3 py-2 rounded-xl flex items-center gap-1 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowUpCircle className="w-4 h-4" /> Empeora
              </button>
            </div>
          </div>

          {data.modificadores.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-slate-200">
              {data.modificadores.map((mod, index) => (
                <div key={index} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold ${
                  mod.efecto === 'alivia' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {mod.efecto === 'alivia' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                  <span>{mod.factor}</span>
                  <button type="button" disabled={isReadOnly} onClick={() => eliminarModificador(index)} className="ml-1 opacity-60 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Notas Adicionales</label>
          <textarea
            disabled={isReadOnly}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 min-h-[80px]"
            placeholder="Apunta cualquier otro detalle relevante..."
            value={data.notas}
            onChange={(e) => handleChange('notas', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
