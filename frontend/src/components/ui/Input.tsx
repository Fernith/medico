import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      <input 
        className={`px-3 py-2 border border-slate-200 bg-white rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${className}`} 
        {...props} 
      />
    </div>
  );
};