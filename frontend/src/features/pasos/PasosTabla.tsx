import React, { useState, useMemo } from 'react';
import { Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { type PasoDB, calcularDistanciaKm } from '../../utils/pasosCalculations';

interface PasosTablaProps {
  pasos: PasoDB[];
  alturaCm: number;
  sexo: string;
  onDataChanged: () => void;
}

type SortField = 'fecha' | 'cantidad' | 'distancia';

export const PasosTabla: React.FC<PasosTablaProps> = ({ pasos, alturaCm, sexo, onDataChanged }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Paginación y Ordenamiento
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDesc, setSortDesc] = useState(true);

  const processedData = useMemo(() => {
    let list = pasos.map(p => ({
      ...p,
      distanciaKm: calcularDistanciaKm(p.cantidad, alturaCm, sexo)
    }));

    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'fecha') {
        comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      } else if (sortField === 'cantidad') {
        comparison = a.cantidad - b.cantidad;
      } else if (sortField === 'distancia') {
        comparison = a.distanciaKm - b.distanciaKm;
      }
      return sortDesc ? -comparison : comparison;
    });

    return list;
  }, [pasos, sortField, sortDesc, alturaCm, sexo]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = processedData.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [sortField, sortDesc, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else { setSortField(field); setSortDesc(true); }
  };

  // NUEVO: Renderizado dinámico de la flecha de ordenación
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-slate-300 opacity-50 transition-opacity group-hover:opacity-100" />;
    return sortDesc 
      ? <ArrowDown className="w-4 h-4 text-orange-600 stroke-[3]" /> 
      : <ArrowUp className="w-4 h-4 text-orange-600 stroke-[3]" />;
  };

  const getHeaderClass = (field: SortField) => 
    `px-4 py-3 font-semibold cursor-pointer transition-colors group ${sortField === field ? 'text-orange-700 bg-orange-50/50' : 'hover:text-orange-600 hover:bg-slate-100/50'}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden flex flex-col mt-8">
      <div className="p-4 bg-orange-50/50 border-b border-orange-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-orange-800">Registro Histórico</h2>
      </div>
      
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
            <tr>
              <th className={getHeaderClass('fecha')} onClick={() => handleSort('fecha')}>
                <div className="flex items-center gap-1">Fecha {renderSortIcon('fecha')}</div>
              </th>
              <th className={getHeaderClass('cantidad')} onClick={() => handleSort('cantidad')}>
                <div className="flex items-center gap-1">Pasos {renderSortIcon('cantidad')}</div>
              </th>
              <th className={getHeaderClass('distancia')} onClick={() => handleSort('distancia')}>
                <div className="flex items-center gap-1">Distancia (km) {renderSortIcon('distancia')}</div>
              </th>
              <th className="px-4 py-3 font-semibold">BBDD Timestamp</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-700">{new Date(p.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3 font-black text-orange-600">{p.cantidad.toLocaleString('es-ES')}</td>
                <td className="px-4 py-3 font-bold text-slate-600">{p.distanciaKm.toFixed(2)} km</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-medium">{p.creado_en ? new Date(p.creado_en).toLocaleString('es-ES') : 'Auto (Google Fit)'}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => setDeleteId(p.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Borrar registro"><Trash2 className="w-5 h-5 inline" /></button>
                </td>
              </tr>
            ))}
            {pasos.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No hay pasos registrados en la base de datos.</td></tr>}
          </tbody>
        </table>
      </div>

      {pasos.length > 0 && (
        <div className="p-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
          <div className="flex items-center gap-2 order-1 sm:order-none">
            <span className="font-semibold text-slate-600">Filas:</span>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-orange-500 font-medium shadow-sm cursor-pointer hover:border-slate-300">
              <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
          </div>
          <span className="font-medium text-slate-600 order-3 sm:order-none w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, processedData.length)} de {processedData.length} resultados
          </span>
          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm order-2 sm:order-none ml-auto sm:ml-0">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
            <span className="font-bold text-slate-700 min-w-[3rem] text-center">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId} 
        onCancel={() => setDeleteId(null)} 
        onConfirm={async () => {
          await fetch(`/api/pasos/historial/${deleteId}`, { method: 'DELETE' });
          setDeleteId(null); 
          onDataChanged();
        }} 
        title="Borrar Registro" 
        description="⚠️ Si borras este registro de pasos y cae dentro de los últimos 30 días, es posible que la sincronización de Google Fit vuelva a importarlo mañana." 
        variant="danger" confirmText="Borrar" 
      />
    </div>
  );
};