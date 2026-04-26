import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GET_MOVIMIENTOS, GET_PRODUCTOS, CREAR_MOVIMIENTO } from '../graphql/queries.js';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

function ModalMovimiento({ tipo, onClose, refetch }) {
  const [crearMovimiento, { loading }] = useMutation(CREAR_MOVIMIENTO);
  const { data } = useQuery(GET_PRODUCTOS, { variables: { soloActivos: true, limite: 100 } });
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { tipo } });

  const productoId = watch('productoId');
  const cantidad = watch('cantidad');
  const precioUnitario = watch('precioUnitario');
  const productoSel = data?.productos?.productos?.find(p => p.id === productoId);

  const onSubmit = async (data) => {
    if (tipo === 'SALIDA' && productoSel && Number(data.cantidad) > productoSel.stockActual) {
      toast.error(`Stock insuficiente. Solo hay ${productoSel.stockActual} ${productoSel.unidad}`);
      return;
    }
    if (!confirm(`¿Confirmar ${tipo === 'ENTRADA' ? 'entrada' : 'salida'} de ${data.cantidad} unidades?`)) return;
    try {
      await crearMovimiento({ variables: { input: { ...data, tipo, cantidad: Number(data.cantidad), precioUnitario: Number(data.precioUnitario) } } });
      toast.success(`✅ ${tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada correctamente`);
      refetch();
      onClose();
    } catch (err) { toast.error(err.message); }
  };

  const esEntrada = tipo === 'ENTRADA';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{esEntrada ? '↑ Registrar Entrada' : '↓ Registrar Salida'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Producto *</label>
            <select className="form-select" {...register('productoId', { required: 'Selecciona un producto' })}>
              <option value="">— Selecciona un producto —</option>
              {data?.productos?.productos?.map(p => (
                <option key={p.id} value={p.id}>{p.codigo} - {p.nombre} (Stock: {p.stockActual} {p.unidad})</option>
              ))}
            </select>
            {errors.productoId && <span className="form-error">{errors.productoId.message}</span>}
          </div>

          {productoSel && (
            <div className="alert alert-warning">
              📦 Stock actual: <strong>{productoSel.stockActual} {productoSel.unidad}</strong> · Stock mínimo: {productoSel.stockMinimo}
              {!esEntrada && productoSel.bajoStock && <span style={{ color: 'var(--danger)', display: 'block' }}>⚠️ Producto ya está bajo stock mínimo</span>}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Cantidad *</label>
              <input className="form-input" type="number" min="1" step="0.01"
                {...register('cantidad', { required: 'Requerido', min: { value: 0.01, message: 'Debe ser mayor a 0' } })} />
              {errors.cantidad && <span className="form-error">{errors.cantidad.message}</span>}
              {!esEntrada && productoSel && cantidad > productoSel.stockActual && (
                <span className="form-error">⚠️ Supera el stock disponible</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">{esEntrada ? 'Precio Compra *' : 'Precio Venta *'}</label>
              <input className="form-input" type="number" min="0" step="100"
                defaultValue={!esEntrada && productoSel ? productoSel.precioVenta : ''}
                {...register('precioUnitario', { required: 'Requerido', min: 0 })} />
            </div>
          </div>

          {cantidad && precioUnitario && (
            <div className="alert alert-success">
              💰 Total: <strong>{fmt(Number(cantidad) * Number(precioUnitario))}</strong>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Observación</label>
            <textarea className="form-textarea" {...register('observacion')} placeholder="Motivo, referencia de orden, etc." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className={`btn ${esEntrada ? 'btn-primary' : 'btn-danger'}`} disabled={loading}>
              {loading ? '⏳ Procesando...' : `✅ Confirmar ${esEntrada ? 'Entrada' : 'Salida'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Movimientos() {
  const [modal, setModal] = useState(null);
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, loading, refetch } = useQuery(GET_MOVIMIENTOS, {
    variables: { tipo: tipo || undefined, fechaInicio: fechaInicio || undefined, fechaFin: fechaFin || undefined, pagina, limite: 15 },
    fetchPolicy: 'network-only',
  });

  const movimientos = data?.movimientos?.movimientos || [];
  const { total = 0, paginas = 1 } = data?.movimientos || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-subtitle">{total} movimientos registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setModal('ENTRADA')}>↑ Nueva Entrada</button>
          <button className="btn btn-danger" onClick={() => setModal('SALIDA')}>↓ Nueva Salida</button>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <select className="form-select" style={{ width: 160 }} value={tipo} onChange={e => { setTipo(e.target.value); setPagina(1); }}>
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">↑ Entrada</option>
            <option value="SALIDA">↓ Salida</option>
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Desde</label>
            <input type="date" className="form-input" style={{ width: 160 }} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            <label style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Hasta</label>
            <input type="date" className="form-input" style={{ width: 160 }} value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            {(tipo || fechaInicio || fechaFin) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setTipo(''); setFechaInicio(''); setFechaFin(''); setPagina(1); }}>✕ Limpiar</button>
            )}
          </div>
        </div>

        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Fecha/Hora</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Precio Unit.</th><th>Total</th><th>Stock Antes</th><th>Stock Después</th><th>Observación</th><th>Usuario</th></tr>
                </thead>
                <tbody>
                  {movimientos.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{new Date(m.createdAt).toLocaleString('es-CO')}</td>
                      <td><strong>{m.producto?.nombre}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text2)', fontFamily: 'monospace' }}>{m.producto?.codigo}</span></td>
                      <td><span className={`badge ${m.tipo === 'ENTRADA' ? 'badge-info' : 'badge-danger'}`}>{m.tipo === 'ENTRADA' ? '↑' : '↓'} {m.tipo}</span></td>
                      <td><strong>{m.cantidad}</strong> {m.producto?.unidad}</td>
                      <td>{fmt(m.precioUnitario)}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(m.precioTotal)}</td>
                      <td>{m.stockAntes}</td>
                      <td>{m.stockDespues}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text2)', maxWidth: 150 }}>{m.observacion || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{m.usuario?.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movimientos.length === 0 && <div className="empty-state"><span className="empty-icon">🔄</span><h3>Sin movimientos</h3></div>}
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

      {modal && <ModalMovimiento tipo={modal} onClose={() => setModal(null)} refetch={refetch} />}
    </div>
  );
}