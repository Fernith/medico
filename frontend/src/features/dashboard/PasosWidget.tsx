import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Smile, Meh, Frown } from 'lucide-react';
import { formatearFechaRelativa } from '../../utils/formatters';

interface PasosWidgetProps {
  data: {
    hoy: number;
    meta: number;
    totalMes: number;
    metaMensual: number;
    ultimaFecha: string | null;
  }
}

export const PasosWidget = ({ data }: PasosWidgetProps) => {
  const porcPasos = Math.min(100, (data.hoy / data.meta) * 100);
  
  const dataRosco = [
    { value: porcPasos, fill: '#ec4899' },
    { value: 100 - porcPasos, fill: '#fce7f3' } 
  ];
  
  const barraVisualMes = Math.min(data.totalMes, data.metaMensual);
  const dataRango = [{ name: 'Mes', valor: barraVisualMes }];
  
  const porcMes = (data.totalMes / data.metaMensual) * 100;
  const pinPercent = Math.min(100, porcMes);

  const IconoEstado = data.hoy >= data.meta 
    ? <Smile className="w-10 h-10 text-green-500" />
    : data.hoy >= 6000 
      ? <Meh className="w-10 h-10 text-orange-400" />
      : <Frown className="w-10 h-10 text-pink-500" />;

  const { sufijo } = formatearFechaRelativa(data.ultimaFecha);

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-pink-50 rounded-2xl">
            <Activity className="w-7 h-7 text-pink-500" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Pasos</h2>
            <p className="text-sm text-slate-400 font-medium hidden md:block">Actividad física</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-slate-500 font-bold mb-1 uppercase tracking-wider">Caminados {sufijo}</p>
            <p className="text-3xl md:text-4xl font-black text-pink-600">{data.hoy.toLocaleString('es-ES')}</p>
          </div>
          <div className="hidden md:block">{IconoEstado}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        <div className="flex items-center justify-center md:justify-start gap-8">
          <div className="h-32 w-32 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataRosco} dataKey="value" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{Math.round(porcPasos)}%</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">Progreso diario</p>
            <p className="text-sm text-slate-500 mt-1">Tu meta es de<br/>{data.meta.toLocaleString()} pasos.</p>
          </div>
        </div>

        <div className="bg-slate-50/50 p-5 pt-7 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-end text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
            <span>Reto Mensual</span>
            <span className="text-[10px]">Progreso: <span className="text-slate-700 text-xs">{porcMes.toFixed(1)}%</span></span>
          </div>
          
          <div className="h-8 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={dataRango} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, data.metaMensual]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  formatter={() => [`${data.totalMes.toLocaleString('es-ES')} pasos`, 'Total Acumulado']} 
                />
                <Bar dataKey="valor" fill="#f9a8d4" radius={12} background={{ fill: '#f1f5f9' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="relative mt-3 h-6 text-[11px] font-medium w-full">
            <span className="absolute left-0 top-0 text-slate-400">0</span>
            
            <span 
              className="absolute top-0 -translate-x-1/2 text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-md transition-all duration-500"
              style={{ left: `${pinPercent}%` }}
            >
              {data.totalMes.toLocaleString('es-ES')}
            </span>
            
            <span className="absolute right-0 top-0 text-slate-400">{data.metaMensual.toLocaleString('es-ES')}</span>
          </div>
        </div>

      </div>
    </div>
  );
};