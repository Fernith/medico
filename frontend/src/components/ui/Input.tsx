import React, { forwardRef } from 'react';

export interface InputColorTheme {
  borderNormal: string;
  borderFocus: string;
  borderError: string;
  iconColor: string;
  labelColor: string;
  helperTextColor: string;
}

// Tema por defecto (Gama Rosa/Morado)
const defaultTheme: InputColorTheme = {
  borderNormal: 'border-pink-200 hover:border-pink-300',
  borderFocus: 'focus:ring-pink-500 focus:border-pink-500',
  borderError: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  iconColor: 'text-pink-500',
  labelColor: 'text-gray-700',
  helperTextColor: 'text-gray-500'
};

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  colorTheme?: Partial<InputColorTheme>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, icon, clearable, onClear, colorTheme = {}, id, value, disabled, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substring(7);
    const theme = { ...defaultTheme, ...colorTheme };

    // Solo mostramos el botón de limpiar si hay texto, no está deshabilitado y se ha activado la prop
    const showClear = clearable && value !== undefined && value !== null && value !== '' && !disabled;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={`block text-sm font-medium ${theme.labelColor} mb-1 pl-1`}>
            {label}
          </label>
        )}
        
        <div className="relative flex items-center">
          {/* Icono a la izquierda */}
          {icon && (
            <div className={`absolute left-4 ${disabled ? 'text-gray-400' : theme.iconColor} pointer-events-none`}>
              {icon}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            value={value}
            disabled={disabled}
            className={`w-full bg-white border rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${icon ? 'pl-11' : 'pl-4'} 
              ${showClear ? 'pr-11' : 'pr-4'} 
              py-3
              ${error ? theme.borderError : `${theme.borderNormal} ${theme.borderFocus}`}
              ${className}
            `}
            {...props}
          />

          {/* Botón de limpiar a la derecha */}
          {showClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 text-gray-300 hover:text-red-500 transition-colors p-1 bg-white rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-500 pl-1">{error}</p>}
        {/* HelperText pegado al input gracias al mt-0.5 */}
        {helperText && !error && <p className={`mt-0.5 text-xs ${theme.helperTextColor} pl-1`}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';