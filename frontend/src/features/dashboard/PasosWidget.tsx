import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Smile, Meh, Frown, ChevronRight } from 'lucide-react';
import { formatearFechaRelativa } from '../../utils/formatters';
import { calcularDistanciaKm, getDiasDelMes } from '../../utils/pasosCalculations';
import { useAjustes } from '../../context/AjustesContext';

interface PasosWidgetProps {
  data: {
    hoy: number;
    totalMes: number;
    ultimaFecha: string | null;
  }
}

const CustomTooltipPasos = ({ active, payload, altura, sexo }: any) => {
  if (active && payload && payload.length) {
    const pasos = payload[0].value;
    const distancia = calcularDistanciaKm(pasos, altura, sexo);
    
    return (
      <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 text-center min-w-[160px] animate-in zoom-in-95 duration-200">
        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Reto Mensual</p>
        <div className="bg-orange-50/80 rounded-2xl p-3 mb-2 border border-orange-100/50">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Total Pasos</p>
          <p className="text-3xl font-black text-orange-600 leading-none">{pasos.toLocaleString('es-ES')}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Distancia</p>
          <p className="text-sm font-black text-slate-700 leading-none">{distancia.toFixed(2)} km</p>
        </div>
      </div>
    );
  }
  return null;
};

export const PasosWidget = ({ data }: PasosWidgetProps) => {
  const [altura, setAltura] = useState<number>(170);
  const [sexo, setSexo] = useState<string>('Masculino');
  
  // Obtenemos la meta desde la BBDD a través del Contexto
  const { ajustes } = useAjustes();
  const metaDiaria = Number(ajustes['objetivo_pasos_diarios']) || 8000;
  const metaMensual = metaDiaria * getDiasDelMes();

  useEffect(() => {
    fetch('/api/usuario')
      .then(res => res.json())
      .then(userData => {
        if (userData) {
          if (userData.altura) setAltura(userData.altura);
          if (userData.sexo) setSexo(userData.sexo);
        }
      }).catch(console.error);
  }, []);

  const porcPasos = Math.min(100, (data.hoy / metaDiaria) * 100);
  
  const dataRosco = [
    { value: porcPasos, fill: '#f97316' }, 
    { value: 100 - porcPasos, fill: '#ffedd5' }
  ];
  
  const barraVisualMes = Math.min(data.totalMes, metaMensual);
  const dataRango = [{ name: 'Mes', valor: barraVisualMes }];
  
  const porcMes = (data.totalMes / metaMensual) * 100;
  const pinPercent = Math.min(100, porcMes);

  const IconoEstado = data.hoy >= metaDiaria 
    ? <Smile className="w-10 h-10 text-emerald-500" />
    : data.hoy >= (metaDiaria * 0.75) 
      ? <Meh className="w-10 h-10 text-amber-400" />
      : <Frown className="w-10 h-10 text-rose-500" />;

  const { sufijo } = formatearFechaRelativa(data.ultimaFecha);

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative">
      
      <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
        <Link to="/pasos" className="flex items-center gap-4 group cursor-pointer hover:opacity-80 transition-opacity">
          <div className="p-3 bg-orange-50 rounded-2xl group-hover:bg-orange-100 transition-colors">
            <Activity className="w-7 h-7 text-orange-500 group-hover:text-orange-600 transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-orange-600 group-hover:text-orange-800 transition-colors">Pasos</h2>
              <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-orange-500 transition-colors" strokeWidth={3} />
            </div>
            <p className="text-sm text-slate-400 font-medium hidden md:block">Actividad física</p>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-slate-500 font-bold mb-1 uppercase tracking-wider">Caminados {sufijo}</p>
            <p className="text-3xl md:text-4xl font-black text-orange-600">{data.hoy.toLocaleString('es-ES')}</p>
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
            <p className="text-sm text-slate-500 mt-1">Tu meta es de<br/><span className="font-bold text-orange-500">{metaDiaria.toLocaleString()}</span> pasos.</p>
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
                <XAxis type="number" domain={[0, metaMensual]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip cursor={{fill: 'transparent'}} allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 1000, outline: 'none' }} content={<CustomTooltipPasos altura={altura} sexo={sexo} />} />
                <Bar dataKey="valor" fill="#fdba74" radius={12} background={{ fill: '#f1f5f9' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="relative mt-3 h-6 text-[11px] font-medium w-full">
            <span className="absolute left-0 top-0 text-slate-400">0</span>
            <span className="absolute top-0 -translate-x-1/2 text-orange-600 font-bold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md transition-all duration-500" style={{ left: `${pinPercent}%` }}>
              {data.totalMes.toLocaleString('es-ES')}
            </span>
            <span className="absolute right-0 top-0 text-slate-400">{metaMensual.toLocaleString('es-ES')}</span>
          </div>
        </div>

      </div>
    </div>
  );
};