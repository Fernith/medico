import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Moon, Scale, Droplet, Menu, X, User, Settings } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/', icon: Activity, label: 'Resumen', activeColor: 'text-purple-600 bg-purple-50' },
    { path: '/peso', icon: Scale, label: 'Peso', activeColor: 'text-orange-600 bg-orange-50' },
    { path: '/sueno', icon: Moon, label: 'Sueño', activeColor: 'text-purple-600 bg-purple-50' },
    { path: '/regla', icon: Droplet, label: 'Regla', activeColor: 'text-pink-600 bg-pink-50' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        
        {/* IZQUIERDA: Hamburguesa (Móvil) o Logo (PC) */}
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

        {/* CENTRO: Logo (Móvil) o Enlaces (PC) */}
        <div className="flex justify-center md:flex-grow w-1/3 md:w-auto">
          {/* Logo visible solo en móvil, centrado */}
          <Link to="/" className="md:hidden flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-1.5 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="textl font-extrabold text-slate-800 tracking-tight">Mi Salud</span>
          </Link>

          {/* Enlaces visibles solo en PC */}
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
          </div>
        </div>

        {/* DERECHA: Botones Usuario y Ajustes (Móvil y PC) */}
        <div className="flex items-center justify-end gap-1 md:gap-2 w-1/3 md:w-auto">
          <Link to="/ajustes" className="p-2 md:p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <Settings className="w-6 h-6 md:w-5 md:h-5" />
          </Link>
          <Link to="/usuario" className="p-2 md:p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <User className="w-6 h-6 md:w-5 md:h-5" />
          </Link>
        </div>

      </div>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 flex flex-col gap-2 shadow-lg absolute w-full animate-in slide-in-from-top-2">
          {navItems.map((item) => {
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