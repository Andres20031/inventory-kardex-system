import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Productos from './pages/Productos.jsx';
import Movimientos from './pages/Movimientos.jsx';
import Kardex from './pages/Kardex.jsx';
import Reportes from './pages/Reportes.jsx';

const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="loader"><div className="spinner" /></div>;
  return usuario ? children : <Navigate to="/login" replace />;
};

const RutaPublica = ({ children }) => {
  const { usuario } = useAuth();
  return usuario ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1e29', color: '#e8eaf0', border: '1px solid #242836' } }} />
        <Routes>
          <Route path="/login" element={<RutaPublica><Login /></RutaPublica>} />
          <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<Productos />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="kardex" element={<Kardex />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}