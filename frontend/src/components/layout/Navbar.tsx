import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Moon, Scale, Droplet, Menu, X, User, Settings, Pill, Stethoscope, Dumbbell, ChevronDown, HeartPulse } from 'lucide-react';
import { useAjustes } from '../../context/AjustesContext';

export const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaludDropdownOpen, setIsSaludDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { ajustes } = useAjustes();
  const mostrarRegla = ajustes['mostrar_regla'] !== 'false';
  
  // Cierra el dropdown si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSaludDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', icon: Activity, label: 'Resumen', activeColor: 'text-purple-600 bg-purple-50' },
    { path: '/entrenamiento', icon: Dumbbell, label: 'Entrenamiento', activeColor: 'text-indigo-600 bg-indigo-50' },
    { path: '/peso', icon: Scale, label: 'Peso', activeColor: 'text-emerald-600 bg-emerald-50' },
    { path: '/sueno', icon: Moon, label: 'Sueño', activeColor: 'text-purple-600 bg-purple-50' },
  ];

  if (mostrarRegla) {
    navItems.push({ path: '/regla', icon: Droplet, label: 'Regla', activeColor: 'text-pink-600 bg-pink-50' });
  }

  const saludItems = [
    { path: '/medicamentos', icon: Pill, label: 'Medicamentos', activeColor: 'text-blue-600 bg-blue-50' },
    { path: '/sintomas', icon: Stethoscope, label: 'Síntomas', activeColor: 'text-teal-600 bg-teal-50' },
  ];

  const isSaludActive = saludItems.some(item => location.pathname === item.path);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        
        {/* IZQUIERDA: Hamburguesa o Logo */}
        <div className="flex items-center gap-2 w-1/3 md:w-auto">
          <button 
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
          
          <Link to="/" className="hidden md:flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-2 rounded-xl group-hover:opacity-90 transition-opacity">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">Mi Salud</span>
          </Link>
        </div>

        {/* CENTRO: Enlaces (PC) */}
        <div className="flex justify-center md:flex-grow w-1/3 md:w-auto">
          <Link to="/" className="md:hidden flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-1.5 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">Mi Salud</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                    isActive ? item.activeColor : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* DROPDOWN SALUD (PC) */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsSaludDropdownOpen(!isSaludDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                  isSaludActive || isSaludDropdownOpen ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <HeartPulse className="w-5 h-5" strokeWidth={isSaludActive ? 2.5 : 2} />
                <span className="text-sm">Clínico</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isSaludDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSaludDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                  {saludItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link 
                        key={item.path} 
                        to={item.path}
                        onClick={() => setIsSaludDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                          isActive ? item.activeColor : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DERECHA: Botones Usuario y Ajustes */}
        <div className="flex items-center justify-end gap-1 md:gap-2 w-1/3 md:w-auto">
          <Link to="/ajustes" className="p-2 md:p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <Settings className="w-6 h-6 md:w-5 md:h-5" />
          </Link>
          <Link to="/usuario" className="p-2 md:p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <User className="w-6 h-6 md:w-5 md:h-5" />
          </Link>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 flex flex-col gap-2 shadow-lg absolute w-full animate-in slide-in-from-top-2 h-[calc(100vh-5rem)] overflow-y-auto">
          {[...navItems, ...saludItems].map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive ? item.activeColor : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};