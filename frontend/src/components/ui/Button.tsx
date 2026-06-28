import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
  const styles = variant === 'primary' 
    ? "bg-blue-600 hover:bg-blue-700 text-white" 
    : "bg-slate-100 hover:bg-slate-200 text-slate-700";

  return (
    <button className={`${baseStyle} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
};