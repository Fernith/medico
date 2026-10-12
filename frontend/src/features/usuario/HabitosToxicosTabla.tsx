import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/ui/Modal';
import { HabitosToxicosForm, type HabitoToxicoItem, HABITOS_BASE } from './HabitosToxicosForm';
import { apiClient } from '../../api/client';
import { Wine, Cigarette, Coffee, Zap, AlertOctagon, HelpCircle, Flame, Edit2 } from 'lucide-react';

export const HabitosToxicosTabla: React.FC = () => {
  const [habitos, setHabitos] = useState<HabitoToxicoItem[]>(HABITOS_BASE);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const cargarHabitos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<HabitoToxicoItem[]>('/habitos-toxicos');
      if (res.data && res.data.length > 0) {
        const mapExistentes = new Map(res.data.map(item => [item.clave, item]));
        const listaCompleta = HABITOS_BASE.map(base => {
          const existente = mapExistentes.get(base.clave);
          return existente ? { ...existente } : base;
        });
        setHabitos(listaCompleta);
      }
    } catch (err: unknown) {
      console.error('Error al cargar hábitos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarHabitos();
  }, [cargarHabitos]);

  const modalTheme = {
    titleColor: 'text-indigo-900',
    headerBorder: 'border-indigo-100',
    closeIconColor: 'text-slate-400',
    closeIconHover: 'hover:text-indigo-600',
    modalBorder: 'border-indigo-400',
  };

  const getIcono = (clave: string) => {
    switch (clave) {
      case 'cafeina': return <Coffee className="w-4 h-4 text-amber-800 shrink-0" />;
      case 'bebidas_energeticas': return <Zap className="w-4 h-4 text-yellow-600 shrink-0" />;
      case 'tabaco': return <Cigarette className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'vapeo': return <Flame className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'alcohol': return <Wine className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'cannabis': return <AlertOctagon className="w-4 h-4 text-emerald-600 shrink-0" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const labelEstado = (estado: HabitoToxicoItem['estado']) => {
    switch (estado) {
      case 'no_consume': return 'No consume';
      case 'consumo_activo': return 'Consume actualmente';
      case 'ex_consumidor': return 'Ex-consumidor';
      default: return estado;
    }
  };

  const badgeEstado = (estado: HabitoToxicoItem['estado']) => {
    switch (estado) {
      case 'no_consume':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'consumo_activo':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'ex_consumidor':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const labelFrecuencia = (frec: HabitoToxicoItem['frecuencia']) => {
    if (!frec) return '-';
    switch (frec) {
      case 'diario': return 'Diario';
      case 'semanal': return 'Semanal';
      case 'fin_de_semana': return 'Fines de semana';
      case 'social': return 'Social / Eventos';
      case 'ocasional': return 'Esporádico / Ocasional';
      default: return frec;
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col w-full">
        {/* CABECERA */}
        <div className="p-4 sm:p-5 bg-indigo-50/50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 leading-tight">Tóxicos y Hábitos Basales</h2>
              <p className="text-xs text-slate-500">Evaluación basal de consumo de tabaco, alcohol, cafeína y otras sustancias</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-500/30 w-full sm:w-auto h-[42px] shrink-0"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar Hábitos y Tóxicos</span>
          </button>
        </div>

        {/* TABLA ADAPTABLE SIN SCROLL HORIZONTAL */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-xs sm:text-sm text-left table-fixed">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-3 py-3 font-semibold">Hábito / Sustancia</th>
                <th className="px-2 py-3 font-semibold">Categoría</th>
                <th className="px-3 py-3 font-semibold">Estado</th>
                <th className="px-2 py-3 font-semibold">Frecuencia</th>
                <th className="px-2 py-3 font-semibold">Cantidad</th>
                <th className="px-3 py-3 font-semibold">Observaciones / Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-indigo-500 animate-pulse font-medium">
                    Cargando hábitos y tóxicos...
                  </td>
                </tr>
              ) : (
                habitos.map(item => (
                  <tr key={item.clave} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-3 font-bold text-slate-800 break-words">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-slate-50 border border-slate-200 shrink-0">
                          {getIcono(item.clave)}
                        </div>
                        <span className="leading-tight">{item.nombre}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-slate-500">
                        {item.categoria === 'toxico' ? 'Tóxico' : 'Hábito'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] sm:text-xs border ${badgeEstado(item.estado)} leading-snug break-words text-center`}>
                        {labelEstado(item.estado)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-700 font-medium break-words">
                      {item.estado === 'no_consume' ? <span className="text-slate-300">-</span> : labelFrecuencia(item.frecuencia)}
                    </td>
                    <td className="px-2 py-3 text-slate-700 break-words">
                      {item.estado === 'no_consume' || !item.cantidad ? (
                        <span className="text-slate-300">-</span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-800" title={item.cantidad}>
                          {item.cantidad}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-600 break-words">
                      {item.estado === 'no_consume' || !item.notas ? (
                        <span className="text-slate-300">-</span>
                      ) : (
                        <span className="text-xs text-slate-600 leading-tight" title={item.notas}>
                          {item.notas}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Editar Hábitos y Tóxicos Basales"
        size="xl"
        colorTheme={modalTheme}
        preventClose={true}
      >
        <HabitosToxicosForm
          initialData={habitos}
          onSuccess={() => {
            setIsEditOpen(false);
            cargarHabitos();
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>
    </>
  );
};
