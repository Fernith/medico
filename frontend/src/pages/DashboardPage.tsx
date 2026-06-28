import { getFechaFormateada } from '../utils/formatters';
import { MOCK_DATA } from '../data/mockData';
import { SuenoWidget } from '../features/dashboard/SuenoWidget';
import { PasosWidget } from '../features/dashboard/PasosWidget';

export const DashboardPage = () => {
  const { diaSemana, fechaCompleta } = getFechaFormateada();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER: Título a la izq, Fecha a la der (en PC). Apilado en móvil. */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Resumen
          </h1>
          <p className="text-slate-500 font-medium mt-1 md:text-lg">Tu estado actual</p>
        </div>
        
        <div className="md:text-right bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none border md:border-none border-slate-100 shadow-sm md:shadow-none">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 capitalize">
            {diaSemana}
          </h2>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            {fechaCompleta}
          </p>
        </div>
      </header>

      {/* WIDGETS EXPANDIDOS */}
      <SuenoWidget data={MOCK_DATA.sueno} />
      <PasosWidget data={MOCK_DATA.pasos} />
      
    </div>
  );
};