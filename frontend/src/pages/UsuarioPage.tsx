import { User } from 'lucide-react'; // Cambia User por Settings en la otra

export const UsuarioPage = () => (
  <div className="animate-in fade-in duration-500">
    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">Mi Perfil</h1>
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center h-64 text-slate-400">
      <User className="w-12 h-12 mb-3 text-slate-300" />
      <p>Módulo de usuario en construcción</p>
    </div>
  </div>
);