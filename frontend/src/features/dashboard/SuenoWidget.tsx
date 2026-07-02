import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Moon } from 'lucide-react';
import { calcularPorcentajeSuenoMinutos, formatearMinutos, formatearFechaRelativa } from '../../utils/formatters';

interface SuenoWidgetProps {
  data: {
    hoyMinutos: number;
    ultimos7DiasMin: number;
    ultimos7DiasMax: number;
    media7Dias: number;
    ultimaFecha: string | null;
  }
}

export const SuenoWidget = ({ data }: SuenoWidgetProps) => {
  const porcSueno = calcularPorcentajeSuenoMinutos(data.hoyMinutos);
  
  const dataRosco = [
    { value: porcSueno, fill: '#9333ea' }, 
    { value: 100 - porcSueno, fill: '#f3e8ff' } 
  ];
  
  const dataRango = [{ name: 'Rango', valor: [data.ultimos7DiasMin / 60, data.ultimos7DiasMax / 60] }];

  const minPercent = (data.ultimos7DiasMin / 720) * 100;
  const maxPercent = (data.ultimos7DiasMax / 720) * 100;
  const mediaPercent = (data.media7Dias / 720) * 100;

  const { esHoy, sufijo } = formatearFechaRelativa(data.ultimaFecha);

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-2xl">
            <Moon className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Sueño</h2>
            <p className="text-sm text-slate-400 font-medium hidden md:block">Descanso diario</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-bold mb-1 uppercase tracking-wider">
            {esHoy ? 'Has dormido' : `Dormiste ${sufijo}`}
          </p>
          <p className="text-3xl md:text-4xl font-black text-purple-600">{formatearMinutos(data.hoyMinutos)}</p>
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
              <span className="text-2xl font-black text-slate-800">{Math.round(porcSueno)}%</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">Calidad del sueño</p>
            <p className="text-sm text-slate-500 mt-1">Acercándote a tu meta<br/>de 8 horas diarias.</p>
          </div>
        </div>

        <div className="bg-slate-50/50 p-5 pt-8 rounded-2xl border border-slate-100">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
            <span>Rango últimos 7 días</span>
            <span>Media: <span className="text-slate-700">{formatearMinutos(data.media7Dias)}</span></span>
          </div>
          
          <div className="h-8 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={dataRango} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 12]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  formatter={(value: any) => {
                    if (Array.isArray(value)) return [`De ${formatearMinutos(value[0] * 60)} a ${formatearMinutos(value[1] * 60)}`, 'Rango'];
                    return [formatearMinutos(Number(value) * 60), 'Rango'];
                  }} 
                />
                <Bar dataKey="valor" fill="#d8b4fe" radius={12} background={{ fill: '#f1f5f9' }} />
              </BarChart>
            </ResponsiveContainer>

            <div 
              className="absolute top-[-8px] bottom-[-4px] w-[2px] bg-slate-400/60 z-10 rounded-full pointer-events-none"
              style={{ left: `${mediaPercent}%` }}
            >
              <div className="absolute -top-4 -translate-x-1/2 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
                Media
              </div>
            </div>
          </div>
          
          <div className="relative mt-3 h-6 text-[11px] font-medium w-full">
            <span className="absolute left-0 top-0 text-slate-400">0h</span>
            <span className="absolute top-0 -translate-x-1/2 text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md" style={{ left: `${minPercent}%` }}>
              {formatearMinutos(data.ultimos7DiasMin)}
            </span>
            <span className="absolute top-0 -translate-x-1/2 text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md" style={{ left: `${maxPercent}%` }}>
              {formatearMinutos(data.ultimos7DiasMax)}
            </span>
            <span className="absolute right-0 top-0 text-slate-400">12h</span>
          </div>
        </div>

      </div>
    </div>
  );
};