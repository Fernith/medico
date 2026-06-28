import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-purple-200">
      <Navbar />
      {/* pt-28 asegura que el contenido empiece por debajo de la navbar fixed */}
      <main className="pt-28 px-5 pb-16 max-w-6xl mx-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};