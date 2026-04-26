import { useQuery } from '@apollo/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GET_DASHBOARD, GET_PRODUCTOS, GET_MOVIMIENTOS } from '../graphql/queries.js';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { data: dash, loading: l1 } = useQuery(GET_DASHBOARD, { fetchPolicy: 'network-only' });
  const { data: bajo } = useQuery(GET_PRODUCTOS, { variables: { bajoStock: true, limite: 5 }, fetchPolicy: 'network-only' });
  const { data: movs } = useQuery(GET_MOVIMIENTOS, { variables: { limite: 8 }, fetchPolicy: 'network-only' });

  if (l1) return <div className="loader"><div className="spinner" /></div>;

  const stats = dash?.dashboardStats;
  const grafico = dash?.resumenMovimientosMensual || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Vista general del inventario</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Productos</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats?.totalProductos}</div>
          <div className="stat-sub">{stats?.productosActivos} activos</div>
        </div>
        <div className={`stat-card ${stats?.productosBajoStock > 0 ? 'danger' : 'success'}`}>
          <div className="stat-label">Bajo Stock ⚠️</div>
          <div className="stat-value" style={{ color: stats?.productosBajoStock > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {stats?.productosBajoStock}
          </div>
          <div className="stat-sub">productos por reabastecer</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Movimientos Hoy</div>
          <div className="stat-value">{stats?.totalMovimientosHoy}</div>
          <div className="stat-sub">↑ {stats?.entradasHoy} entradas · ↓ {stats?.salidasHoy} salidas</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Valor Inventario</div>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: '1.4rem' }}>{fmt(stats?.valorTotalInventario)}</div>
          <div className="stat-sub">precio promedio ponderado</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Gráfico */}
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>📊 Movimientos Mensuales</h3>
          {grafico.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">📉</span><h3>Sin datos aún</h3></div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={grafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fill: '#8892a4', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8892a4', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1a1e29', border: '1px solid #242836', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" name="Salidas" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bajo stock */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>⚠️ Productos Bajo Stock</h3>
          {bajo?.productos?.productos?.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">✅</span><h3>¡Todo en orden!</h3></div>
          ) : (
            bajo?.productos?.productos?.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{p.codigo}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stock-out">{p.stockActual}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>mín: {p.stockMinimo}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Últimos movimientos */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>🔄 Últimos Movimientos</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Stock Antes</th><th>Stock Después</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              {movs?.movimientos?.movimientos?.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{new Date(m.createdAt).toLocaleDateString('es-CO')}</td>
                  <td><strong>{m.producto?.nombre}</strong></td>
                  <td><span className={`badge ${m.tipo === 'ENTRADA' ? 'badge-info' : 'badge-danger'}`}>{m.tipo === 'ENTRADA' ? '↑' : '↓'} {m.tipo}</span></td>
                  <td>{m.cantidad}</td>
                  <td>{m.stockAntes}</td>
                  <td>{m.stockDespues}</td>
                  <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{m.usuario?.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}