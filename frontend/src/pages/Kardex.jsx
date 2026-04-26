import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_MOVIMIENTOS, GET_PRODUCTOS } from '../graphql/queries.js';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Kardex() {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data: prods } = useQuery(GET_PRODUCTOS, { variables: { soloActivos: false, limite: 200 } });
  const { data, loading } = useQuery(GET_MOVIMIENTOS, {
    variables: { productoId: productoId || undefined, tipo: tipo || undefined, fechaInicio: fechaInicio || undefined, fechaFin: fechaFin || undefined, pagina, limite: 20 },
    fetchPolicy: 'network-only',
  });

  const movimientos = data?.movimientos?.movimientos || [];
  const { total = 0, paginas = 1 } = data?.movimientos || {};
  const productoSel = prods?.productos?.productos?.find(p => p.id === productoId);

  // Totales del filtro actual
  const entradas = movimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.cantidad, 0);
  const salidas = movimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.cantidad, 0);
  const valorEntradas = movimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.precioTotal, 0);
  const valorSalidas = movimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.precioTotal, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kardex</h1>
          <p className="page-subtitle">Historial detallado de movimientos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>🔍 Filtros</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Producto</label>
            <select className="form-select" value={productoId} onChange={e => { setProductoId(e.target.value); setPagina(1); }}>
              <option value="">— Todos los productos —</option>
              {prods?.productos?.productos?.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={tipo} onChange={e => { setTipo(e.target.value); setPagina(1); }}>
              <option value="">Todos</option>
              <option value="ENTRADA">↑ Entrada</option>
              <option value="SALIDA">↓ Salida</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha Inicio</label>
            <input type="date" className="form-input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha Fin</label>
            <input type="date" className="form-input" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
        </div>
        {(productoId || tipo || fechaInicio || fechaFin) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setProductoId(''); setTipo(''); setFechaInicio(''); setFechaFin(''); setPagina(1); }}>✕ Limpiar filtros</button>
        )}
      </div>

      {/* Resumen */}
      {movimientos.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card accent">
            <div className="stat-label">Total Registros</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">↑ Entradas (cantidad)</div>
            <div className="stat-value">{entradas}</div>
            <div className="stat-sub">{fmt(valorEntradas)}</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">↓ Salidas (cantidad)</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{salidas}</div>
            <div className="stat-sub">{fmt(valorSalidas)}</div>
          </div>
          {productoSel && (
            <div className="stat-card success">
              <div className="stat-label">Stock Actual</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{productoSel.stockActual}</div>
              <div className="stat-sub">{productoSel.unidad} · {productoSel.nombre}</div>
            </div>
          )}
        </div>
      )}

      {/* Tabla Kardex */}
      <div className="card">
        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                    <th>Stock Antes</th>
                    <th>Stock Después</th>
                    <th>Observación</th>
                    <th>Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m, i) => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{((pagina - 1) * 20) + i + 1}</td>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(m.createdAt).toLocaleDateString('es-CO')}<br />
                        <span style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>{new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.875rem' }}>{m.producto?.nombre}</strong><br />
                        <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.75rem' }}>{m.producto?.codigo}</span>
                      </td>
                      <td><span className={`badge ${m.tipo === 'ENTRADA' ? 'badge-info' : 'badge-danger'}`}>{m.tipo === 'ENTRADA' ? '↑' : '↓'} {m.tipo}</span></td>
                      <td><strong>{m.cantidad}</strong></td>
                      <td>{fmt(m.precioUnitario)}</td>
                      <td style={{ color: m.tipo === 'ENTRADA' ? 'var(--accent)' : 'var(--danger)' }}>{fmt(m.precioTotal)}</td>
                      <td style={{ color: 'var(--text2)' }}>{m.stockAntes}</td>
                      <td><strong style={{ color: m.stockDespues > m.stockAntes ? 'var(--success)' : 'var(--danger)' }}>{m.stockDespues}</strong></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text2)', maxWidth: 140 }}>{m.observacion || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{m.usuario?.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movimientos.length === 0 && <div className="empty-state"><span className="empty-icon">📋</span><h3>No hay movimientos con estos filtros</h3></div>}
            </div>
            {paginas > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>← Anterior</button>
                <span style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Página {pagina} de {paginas}</span>
                <button className="page-btn" disabled={pagina === paginas} onClick={() => setPagina(p => p + 1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}