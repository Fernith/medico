import React from 'react';
import { TimelineScroll } from '../features/timeline/TimelineScroll';
import { Activity } from 'lucide-react';

const TimeLinePage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col w-full max-w-5xl mx-auto space-y-4 animate-in fade-in duration-500 pb-4">
      {/* TÍTULO */}
      <div className="flex items-center gap-3 border-b-2 border-indigo-200 pb-4 shrink-0 mt-2">
        <Activity className="w-10 h-10 text-indigo-600" />
        <h1 className="text-3xl font-bold text-slate-800">Línea Temporal</h1>
      </div>
      
      {/* Contenedor del scroll */}
      <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        <TimelineScroll />
      </div>
    </div>
  );
};

export default TimeLinePage;
