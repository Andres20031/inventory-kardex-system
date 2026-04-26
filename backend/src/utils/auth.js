import jwt from 'jsonwebtoken';

export const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const getUsuarioDesdeToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const requireAuth = (usuario) => {
  if (!usuario) throw new Error('No autenticado. Debes iniciar sesión.');
};

export const requireAdmin = (usuario) => {
  requireAuth(usuario);
  if (usuario.rol !== 'admin') throw new Error('Acceso denegado. Se requiere rol de administrador.');
};