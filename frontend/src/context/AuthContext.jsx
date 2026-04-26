import { createContext, useContext, useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const client = useApolloClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('usuario');
    if (token && userData) {
      try { setUsuario(JSON.parse(userData)); } catch {}
    }
    setCargando(false);
  }, []);

  const login = (token, usuarioData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    setUsuario(usuarioData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    client.clearStore();
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando, isAdmin: usuario?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);