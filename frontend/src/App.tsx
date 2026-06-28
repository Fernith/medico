import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PesoPage } from './pages/PesoPage';
import { SuenoPage } from './pages/SuenoPage';
import { ReglaPage } from './pages/ReglaPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="peso" element={<PesoPage />} />
          <Route path="sueno" element={<SuenoPage />} />
          <Route path="regla" element={<ReglaPage />} />
        </Route>
      </Routes>
    </Router>
  );
}