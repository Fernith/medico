import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface Option {
  value: string | number;
  label: string;
}

export interface SelectColorTheme {
  borderNormal: string;
  borderActive: string;
  borderHover: string;
  textSelected: string;
  textPlaceholder: string;
  iconColor: string;
  dropdownBg: string;
  dropdownBorder: string;
  optionSelectedBg: string;
  optionSelectedText: string;
  optionHoverBg: string;
  optionHoverText: string;
  checkIcon: string;
}

// Tema por defecto (Gama Rosa/Morado de la aplicación)
const defaultTheme: SelectColorTheme = {
  borderNormal: 'border-pink-200',
  borderActive: 'border-pink-400 ring-4 ring-pink-50',
  borderHover: 'hover:border-pink-300 hover:shadow-md',
  textSelected: 'text-purple-900',
  textPlaceholder: 'text-gray-400',
  iconColor: 'text-pink-500',
  dropdownBg: 'bg-white',
  dropdownBorder: 'border-pink-100',
  optionSelectedBg: 'bg-pink-50',
  optionSelectedText: 'text-pink-700',
  optionHoverBg: 'hover:bg-pink-50/50',
  optionHoverText: 'hover:text-purple-900',
  checkIcon: 'text-pink-500'
};

interface SelectProps {
  options: Option[];
  value?: string | number | null;
  onChange: (value: any) => void;
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  error?: string;
  clearable?: boolean;
  isLoading?: boolean;
  searchable?: boolean;
  colorTheme?: Partial<SelectColorTheme>; // Permite sobreescribir colores
}

export const Select: React.FC<SelectProps> = ({
  options,
  value = null,
  onChange,
  label,
  placeholder = 'Seleccionar...',
  icon,
  className = '',
  disabled = false,
  error,
  clearable = false,
  isLoading = false,
  searchable = false,
  colorTheme = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fusionamos el tema por defecto con los colores personalizados que nos pasen
  const theme = { ...defaultTheme, ...colorTheme };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus en el buscador al abrir el menú
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm(''); // Limpiamos la búsqueda al cerrar
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  // Filtrado de opciones si el buscador está activo
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchable, searchTerm]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  const isInteractive = !disabled && !isLoading;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">
          {label}
        </label>
      )}

      {/* Botón Principal */}
      <div
        onClick={() => isInteractive && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-4 py-3 bg-white rounded-xl shadow-sm transition-all duration-200
          ${!isInteractive ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${error ? 'border-red-400 ring-2 ring-red-50' : ''}
          ${isInteractive && !error && isOpen ? theme.borderActive : ''}
          ${isInteractive && !error && !isOpen ? `border ${theme.borderNormal} ${theme.borderHover}` : ''}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {icon && <span className={`${disabled ? 'text-gray-400' : theme.iconColor} flex-shrink-0`}>{icon}</span>}
          <span className={`truncate text-lg ${!selectedOption ? theme.textPlaceholder : `${theme.textSelected} font-bold`}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {clearable && selectedOption && isInteractive && (
            <button 
              onClick={handleClear}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {isLoading ? (
            <svg className={`w-5 h-5 animate-spin ${theme.iconColor}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${disabled ? 'text-gray-300' : theme.iconColor} ${isOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-500 pl-1">{error}</p>}

      {/* Lista Desplegable */}
      {isOpen && isInteractive && (
        <div className={`absolute z-50 w-full mt-2 ${theme.dropdownBg} border ${theme.dropdownBorder} rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-72 overflow-hidden flex flex-col`}>
          
          {/* Buscador Integrado */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Evitar que cierre el menú al hacer clic en el input
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-colors"
              />
            </div>
          )}

          <ul className="py-2 overflow-y-auto custom-scrollbar flex-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">No se encontraron resultados.</li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      px-4 py-3 cursor-pointer transition-colors flex items-center justify-between mx-2 rounded-lg
                      ${isSelected ? `${theme.optionSelectedBg} ${theme.optionSelectedText} font-bold` : `text-gray-700 ${theme.optionHoverBg} ${theme.optionHoverText}`}
                    `}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className={`w-5 h-5 ${theme.checkIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};