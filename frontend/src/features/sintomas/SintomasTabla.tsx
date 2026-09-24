import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Edit2, Activity, Calendar, Eye } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { formatearFecha } from '../../utils/formatters';
import { CATALOGO_ANATOMIA } from '../../utils/anatomia';

interface ModificadorDTO {
  factor: string;
  efecto: string;
}

interface LocalizacionPayload {
  localizacion_id: string;
  es_irradiado: boolean;
  lado: 'Izquierdo' | 'Derecho' | 'Ambos' | null;
}

export interface OcurrenciaSintoma {
  id: string;
  sintoma_id: string;
  sintoma_nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  valor_registro: string | null;
  notas: string | null;
  caracteristica: string | null;
  frecuencia: string | null;
  modificadores: ModificadorDTO[];
  localizaciones: LocalizacionPayload[];
  created_at: string;
}

interface Props {
  onView: (item: OcurrenciaSintoma) => void;
  onEdit: (item: OcurrenciaSintoma) => void;
  onDelete: (id: string) => void;
}

export const SintomasTabla: React.FC<Props> = ({ onView, onEdit, onDelete }) => {
  const [ocurrencias, setOcurrencias] = useState<OcurrenciaSintoma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Sort
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortDesc, setSortDesc] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOcurrencias = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/sintomas/ocurrencias');
      if (res.ok) {
        setOcurrencias(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOcurrencias();
    // Escuchar si se crea un síntoma nuevo (opcional, si enviamos eventos)
    const handleSintomaGuardado = () => fetchOcurrencias();
    window.addEventListener('sintomaGuardado', handleSintomaGuardado);
    return () => window.removeEventListener('sintomaGuardado', handleSintomaGuardado);
  }, []);

  const dataProcesada = useMemo(() => {
    let filtrada = ocurrencias.filter(o => 
      o.sintoma_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (o.notas && o.notas.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtrada.sort((a, b) => {
      const dateA = new Date(a.fecha_inicio).getTime();
      const dateB = new Date(b.fecha_inicio).getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });

    return filtrada;
  }, [ocurrencias, searchTerm, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(dataProcesada.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = dataProcesada.slice(startIndex, startIndex + itemsPerPage);

  const getNombreLocalizacion = (id: string) => {
    const loc = CATALOGO_ANATOMIA.find(c => c.id === id);
    return loc ? loc.nombre : id;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-500">
      
      {/* HEADER CONTROLES */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Historial de Síntomas</h2>
            <p className="text-sm text-slate-500 font-medium">Tus registros ordenados por fecha</p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-64 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-50 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar síntoma..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold cursor-pointer hover:text-rose-600 transition-colors" onClick={() => setSortDesc(!sortDesc)}>
                <div className="flex items-center gap-1">Fecha <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-3 font-semibold">Síntoma</th>
              <th className="px-4 py-3 font-semibold">Intensidad / Valor</th>
              <th className="px-4 py-3 font-semibold">Localizaciones</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 font-medium animate-pulse">Cargando historial...</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No hay registros en el historial.</td></tr>
            ) : (
              currentItems.map(o => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-600">
                    <div className="flex items-center gap-1">
                      {formatearFecha(o.fecha_inicio)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{o.sintoma_nombre}</div>
                    {o.notas && <div className="text-xs text-slate-500 truncate max-w-[200px]" title={o.notas}>{o.notas}</div>}
                  </td>
                  <td className="px-4 py-3 font-bold text-rose-700">
                    {o.valor_registro === 'true' ? 'Presente' : o.valor_registro === 'false' ? 'Ausente' : (o.valor_registro || '-')}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                    {o.localizaciones && o.localizaciones.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {o.localizaciones.map((loc, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded-md text-xs border whitespace-nowrap ${loc.es_irradiado ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {getNombreLocalizacion(loc.localizacion_id)}
                            {loc.lado ? ` (${loc.lado})` : ''}
                            {loc.es_irradiado ? ' ⚡' : ''}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-slate-400 italic text-xs">Sin ubicación</span>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => onView(o)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Ver"><Eye className="w-5 h-5 inline" /></button>                      <button onClick={() => onEdit(o)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Editar"><Edit2 className="w-5 h-5 inline" /></button>
                    <button onClick={() => onDelete(o.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Borrar"><Trash2 className="w-5 h-5 inline" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER Paginación */}
      {dataProcesada.length > 0 && (
        <div className="p-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4 rounded-b-2xl">
          <div className="flex items-center gap-2 order-1 sm:order-none">
            <span className="font-semibold text-slate-600">Filas:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
              className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-rose-500 font-medium shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <span className="font-medium text-slate-600 order-3 sm:order-none w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, dataProcesada.length)} de {dataProcesada.length} resultados
          </span>

          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm order-2 sm:order-none ml-auto sm:ml-0">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
            <span className="font-bold text-slate-700 min-w-[3rem] text-center">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
          </div>
        </div>
      )}
    </div>
  );
};
