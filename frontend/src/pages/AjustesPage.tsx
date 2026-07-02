import { AjusteVisibilidadRegla } from '../features/ajustes/AjusteVisibilidadRegla';

export const AjustesPage = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Ajustes</h1>
        <p className="text-slate-500 font-medium mt-2">Configura tu experiencia en la aplicación.</p>
      </header>

      <div className="max-w-2xl">
        <AjusteVisibilidadRegla />
      </div>
    </div>
  );
};