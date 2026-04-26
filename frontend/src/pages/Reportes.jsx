import { useQuery } from '@apollo/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { GET_DASHBOARD, GET_PRODUCTOS } from '../graphql/queries.js';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const COLORS = ['#4f8ef7', '#f87171', '#fbbf24', '#34d399', '#a78bfa', '#fb923c'];

export default function Reportes() {
  const { data: dash } = useQuery(GET_DASHBOARD, { fetchPolicy: 'network-only' });
  const { data: prodData } = useQuery(GET_PRODUCTOS, { variables: { soloActivos: true, limite: 100 }, fetchPolicy: 'network-only' });
  const { data: bajoData } = useQuery(GET_PRODUCTOS, { variables: { bajoStock: true, soloActivos: true, limite: 50 }, fetchPolicy: 'network-only' });

  const productos = prodData?.productos?.productos || [];
  const bajoStock = bajoData?.productos?.productos || [];
  const stats = dash?.dashboardStats;
  const grafico = dash?.resumenMovimientosMensual || [];

  // Valor por categoría (pie chart)
  const porCategoria = productos.reduce((acc, p) => {
    const cat = p.categoria;
    if (!acc[cat]) acc[cat] = { name: cat, value: 0, stock: 0 };
    acc[cat].value += p.valorInventario;
    acc[cat].stock += p.stockActual;
    return acc;
  }, {});
  const datosPie = Object.values(porCategoria).sort((a, b) => b.value - a.value);

  // Top 5 por valor de inventario
  const top5 = [...productos].sort((a, b) => b.valorInventario - a.valorInventario).slice(0, 5);

  const valorTotal = productos.reduce((a, p) => a + p.valorInventario, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Análisis y estado del inventario</p>
        </div>
      </div>

      {/* Resumen general */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Valor Total Inventario</div>
          <div className="stat-value" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{fmt(stats?.valorTotalInventario || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Productos Activos</div>
          <div className="stat-value">{stats?.productosActivos}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Bajo Stock</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.productosBajoStock}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Categorías</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{datosPie.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Valor por categoría */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🥧 Valor por Categoría</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={datosPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {datosPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1a1e29', border: '1px solid #242836', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Movimientos mensuales */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📊 Movimientos Mensuales</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={grafico} margin={{ left: -20 }}>
              <XAxis dataKey="mes" tick={{ fill: '#8892a4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1e29', border: '1px solid #242836', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="salidas" name="Salidas" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 productos por valor */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>🏆 Top 5 Productos por Valor de Inventario</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Precio Promedio</th><th>Valor Inventario</th><th>% del Total</th></tr></thead>
            <tbody>
              {top5.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{p.codigo}</td>
                  <td><strong>{p.nombre}</strong></td>
                  <td><span className="badge badge-info">{p.categoria}</span></td>
                  <td>{p.stockActual} {p.unidad}</td>
                  <td>{fmt(p.precioPromedio)}</td>
                  <td style={{ color: 'var(--success)' }}><strong>{fmt(p.valorInventario)}</strong></td>
                  <td>{valorTotal > 0 ? ((p.valorInventario / valorTotal) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productos bajo stock */}
      {bajoStock.length > 0 && (
        <div className="card">
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>⚠️ {bajoStock.length} producto(s) por debajo del stock mínimo</div>
          <h3 style={{ marginBottom: 16 }}>🔴 Productos que Requieren Reabastecimiento</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Déficit</th><th>Precio Compra</th><th>Inversión Requerida</th></tr></thead>
              <tbody>
                {bajoStock.map(p => {
                  const deficit = Math.max(0, p.stockMinimo - p.stockActual);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{p.codigo}</td>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className="badge badge-info">{p.categoria}</span></td>
                      <td className="stock-out">{p.stockActual} {p.unidad}</td>
                      <td>{p.stockMinimo}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700 }}>-{deficit}</td>
                      <td>{fmt(p.precioCompra)}</td>
                      <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{fmt(deficit * p.precioCompra)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}