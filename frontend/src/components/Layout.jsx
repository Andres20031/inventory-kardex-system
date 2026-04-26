import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/productos', icon: '📦', label: 'Productos' },
  { path: '/movimientos', icon: '🔄', label: 'Movimientos' },
  { path: '/kardex', icon: '📋', label: 'Kardex' },
  { path: '/reportes', icon: '📈', label: 'Reportes' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>⚙️ Kardex Pro</h2>
          <span>Sistema de Inventario</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{usuario?.nombre?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{usuario?.nombre}</div>
              <div className="user-role">{usuario?.rol === 'admin' ? '👑 Admin' : '👤 Operador'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>🚪 Cerrar sesión</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}