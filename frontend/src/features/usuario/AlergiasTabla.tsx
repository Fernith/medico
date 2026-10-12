import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AlergiaForm, type Alergia } from './AlergiaForm';
import { apiClient } from '../../api/client';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, ShieldAlert, AlertTriangle } from 'lucide-react';

export const AlergiasTabla: React.FC = () => {
  const [alergias, setAlergias] = useState<Alergia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Alergia | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const cargarAlergias = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<Alergia[]>('/alergias');
      setAlergias(res.data);
    } catch (err: unknown) {
      console.error('Error al cargar alergias:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAlergias();
  }, [cargarAlergias]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/alergias/${deleteId}`);
      await cargarAlergias();
    } catch (err: unknown) {
      console.error('Error al eliminar alergia:', err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(alergias.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = alergias.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const modalTheme = {
    titleColor: 'text-indigo-900',
    headerBorder: 'border-indigo-100',
    closeIconColor: 'text-slate-400',
    closeIconHover: 'hover:text-indigo-600',
    modalBorder: 'border-indigo-400',
  };

  const badgeGravedad = (gravedad: Alergia['gravedad']) => {
    switch (gravedad) {
      case 'leve':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'moderada':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'grave':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'potencialmente_mortal':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const labelGravedad = (gravedad: Alergia['gravedad']) => {
    switch (gravedad) {
      case 'leve': return 'Leve';
      case 'moderada': return 'Moderada';
      case 'grave': return 'Grave';
      case 'potencialmente_mortal': return 'Peligro Mortal';
      default: return gravedad;
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col">
        {/* CABECERA */}
        <div className="p-4 sm:p-5 bg-indigo-50/50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 leading-tight">Alergias e Intolerancias</h2>
              <p className="text-xs text-slate-500">Registro de reacciones adversas y sustancias a evitar</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-500/30 w-full sm:w-auto h-[42px]"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>Añadir</span>
          </button>
        </div>

        {/* TABLA ADAPTABLE SIN SCROLL HORIZONTAL */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-xs sm:text-sm text-left table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-3 py-3 font-semibold">Sustancia</th>
                <th className="px-2 py-3 font-semibold">Tipo</th>
                <th className="px-2 py-3 font-semibold">Categoría</th>
                <th className="px-2 py-3 font-semibold">Reacción</th>
                <th className="px-2 py-3 font-semibold">Gravedad</th>
                <th className="px-3 py-3 font-semibold">Diagnóstico / Notas</th>
                <th className="px-2 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-indigo-500 animate-pulse font-medium">
                    Cargando alergias e intolerancias...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No hay alergias ni intolerancias registradas.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-3 font-bold text-slate-800 break-words">
                      {item.sustancia}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold border ${item.tipo === 'alergia' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {item.tipo === 'alergia' ? 'Alergia' : 'Intolerancia'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-600 font-medium capitalize break-words">
                      {item.categoria.replace('_', ' ')}
                    </td>
                    <td className="px-2 py-3 text-slate-700 font-medium capitalize break-words">
                      {item.reaccion}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold border ${badgeGravedad(item.gravedad)}`}>
                        {labelGravedad(item.gravedad)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 break-words">
                      {item.fecha_diagnostico && (
                        <span className="text-[11px] sm:text-xs font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mr-1">
                          {item.fecha_diagnostico}
                        </span>
                      )}
                      {item.notas ? (
                        <span className="text-[11px] sm:text-xs text-slate-500 block leading-tight" title={item.notas}>
                          {item.notas}
                        </span>
                      ) : (
                        !item.fecha_diagnostico && <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setEditItem(item)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {alergias.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between text-sm text-slate-500 bg-slate-50/50 gap-4">
            <div className="flex items-center gap-2 order-1 sm:order-none">
              <span className="font-semibold text-slate-600">Filas:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-indigo-500 font-medium shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <span className="font-medium text-slate-600 order-3 sm:order-none w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, alergias.length)} de {alergias.length} resultados
            </span>

            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm order-2 sm:order-none ml-auto sm:ml-0">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <span className="font-bold text-slate-700 min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL AÑADIR */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Añadir Alergia o Intolerancia"
        size="lg"
        colorTheme={modalTheme}
        preventClose={true}
      >
        <AlergiaForm
          onSuccess={() => {
            setIsAddOpen(false);
            cargarAlergias();
          }}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>

      {/* MODAL EDITAR */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Editar Alergia o Intolerancia"
        size="lg"
        colorTheme={modalTheme}
        preventClose={true}
      >
        {editItem && (
          <AlergiaForm
            initialData={editItem}
            onSuccess={() => {
              setEditItem(null);
              cargarAlergias();
            }}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO FÍSICO */}
      <ConfirmModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registro"
        description="¿Seguro que quieres eliminar permanentemente este registro de alergia o intolerancia? Esta acción borrará el registro de la base de datos de forma definitiva."
        variant="danger"
        confirmText="Eliminar"
        isConfirming={isDeleting}
      />
    </>
  );
};

