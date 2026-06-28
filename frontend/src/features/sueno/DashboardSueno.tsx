import React from 'react';

interface RegistroSueno {
  id: string;
  fecha: string;
  horas_sueno: string;
}

interface DashboardSuenoProps {
  datos: RegistroSueno[];
}

export const DashboardSueno: React.FC<DashboardSuenoProps> = ({ datos }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
            <th className="p-4">Fecha</th>
            <th className="p-4">Horas de Sueño</th>
            <th className="p-4">Calidad Visual</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
          {datos.length === 0 ? (
            <tr><td colSpan={3} className="p-4 text-center text-slate-400">Sin registros de Google Fit</td></tr>
          ) : (
            datos.map((item) => {
              const horas = parseFloat(item.horas_sueno);
              const porcentajeBarra = Math.min((horas / 10) * 100, 100);
              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{item.fecha}</td>
                  <td className="p-4 font-bold text-indigo-600">{horas.toFixed(2)} hrs</td>
                  <td className="p-4 w-1/2">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full ${horas >= 7 ? 'bg-indigo-500' : 'bg-amber-400'}`} 
                        style={{ width: `${porcentajeBarra}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};