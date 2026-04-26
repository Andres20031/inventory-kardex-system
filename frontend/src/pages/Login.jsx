import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LOGIN } from '../graphql/queries.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [autenticar, { loading }] = useMutation(LOGIN);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await autenticar({ variables: { input: data } });
      const { token, usuario } = res.data.autenticarUsuario;
      login(token, usuario);
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-logo">
          <h1>⚙️ Kardex Pro</h1>
          <p>Sistema de Inventario y Kardex</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@kardex.com"
              {...register('email', { required: 'El email es requerido' })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'La contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? '⏳ Ingresando...' : '🔐 Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg3)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text2)' }}>
          <p><strong>Admin:</strong> admin@kardex.com / admin123</p>
          <p><strong>Operador:</strong> operador@kardex.com / operador123</p>
        </div>
      </div>
    </div>
  );
}