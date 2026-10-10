import React from 'react';
import { TimelineScroll } from '../features/timeline/TimelineScroll';
import { Activity } from 'lucide-react';

const TimeLinePage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Timeline</h1>
              <p className="text-slate-500 text-sm mt-1">Línea temporal de tus tomas de medicación y síntomas</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll area, using full height minus header */}
      <div className="flex-1 overflow-hidden">
        <TimelineScroll />
      </div>
    </div>
  );
};

export default TimeLinePage;

