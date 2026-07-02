import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AjustesProvider } from './context/AjustesContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { PesoPage } from './pages/PesoPage';
import { SuenoPage } from './pages/SuenoPage';
import { ReglaPage } from './pages/ReglaPage';
import { AjustesPage } from './pages/AjustesPage';
import { UsuarioPage } from './pages/UsuarioPage';
import { MedicamentosPage } from './pages/MedicamentosPage';
import { SintomasPage } from './pages/SintomasPage';

function App() {
  return (
    <AjustesProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-200 selection:text-purple-900">
          <Navbar />
          {/* El pt-28 da el espacio exacto para que la Navbar fija no tape el contenido */}
          <main className="max-w-6xl mx-auto px-4 md:px-6 pt-28 pb-12">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/peso" element={<PesoPage />} />
              <Route path="/sueno" element={<SuenoPage />} />
              <Route path="/regla" element={<ReglaPage />} />
              <Route path="/medicamentos" element={<MedicamentosPage />} />
              <Route path="/sintomas" element={<SintomasPage />} />
              <Route path="/ajustes" element={<AjustesPage />} />
              <Route path="/usuario" element={<UsuarioPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AjustesProvider>
  );
}

export default App;