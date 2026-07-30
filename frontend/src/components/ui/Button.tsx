import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonColorTheme {
  bgNormal: string;
  bgHover: string;
  textColor: string;
  border?: string;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  colorTheme?: Partial<ButtonColorTheme>;
}

// Temas por defecto de la aplicación
const defaultThemes: Record<ButtonVariant, ButtonColorTheme> = {
  primary: {
    bgNormal: 'bg-pink-500',
    bgHover: 'hover:bg-pink-600',
    textColor: 'text-white',
    border: 'border border-transparent'
  },
  secondary: {
    bgNormal: 'bg-orange-100',
    bgHover: 'hover:bg-orange-200',
    textColor: 'text-orange-800',
    border: 'border border-transparent'
  },
  danger: {
    bgNormal: 'bg-red-500',
    bgHover: 'hover:bg-red-600',
    textColor: 'text-white',
    border: 'border border-transparent'
  },
  ghost: {
    // Arreglo del problema visual: fondo blanco, borde gris, texto oscuro
    bgNormal: 'bg-white',
    bgHover: 'hover:bg-gray-50',
    textColor: 'text-gray-700',
    border: 'border border-gray-300'
  },
  success: {
    // Arreglo del problema visual: fondo blanco, borde gris, texto oscuro
    bgNormal: 'bg-emerald-500',
    bgHover: 'hover:bg-emerald-600',
    textColor: 'text-white',
    border: 'border border-transparent'
  }
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg font-semibold'
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  colorTheme = {},
  className = '',
  disabled,
  ...props
}) => {
  // Mezclamos el tema por defecto de la variante elegida con los colores que se pasen a mano (si los hay)
  const theme = { ...defaultThemes[variant], ...colorTheme };
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1
        ${sizeClasses[size]}
        ${theme.bgNormal} ${theme.textColor} ${theme.border || ''}
        ${!isDisabled ? theme.bgHover : ''}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98] shadow-sm hover:shadow'}
        ${className}
      `}
      {...props}
    >
      {/* Si está cargando, mostramos el spinner de Tailwind */}
      {isLoading && (
        <svg className="w-5 h-5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {/* Si NO está cargando y hay icono, lo pintamos */}
      {!isLoading && icon && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      
      {children}
    </button>
  );
};