import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GET_PRODUCTOS, GET_CATEGORIAS, CREAR_PRODUCTO, ACTUALIZAR_PRODUCTO, ELIMINAR_PRODUCTO, GET_MOVIMIENTOS_PRODUCTO } from '../graphql/queries.js';
import { useAuth } from '../context/AuthContext.jsx';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// Modal de producto
function ModalProducto({ producto, onClose, categorias, refetch }) {
  const [crearProducto, { loading: lc }] = useMutation(CREAR_PRODUCTO);
  const [actualizarProducto, { loading: la }] = useMutation(ACTUALIZAR_PRODUCTO);
  const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: producto
    ? {
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        categoria: producto.categoria,
        unidad: producto.unidad,
        stockMinimo: producto.stockMinimo,
        precioCompra: producto.precioCompra,
        precioVenta: producto.precioVenta,
      }
    : {}
});

  const onSubmit = async (data) => {
    try {
      const input = { ...data, stockMinimo: Number(data.stockMinimo), precioCompra: Number(data.precioCompra), precioVenta: Number(data.precioVenta) };
      if (producto) {
        const { codigo, ...updateData } = input;
        await actualizarProducto({ variables: { id: producto.id, input: updateData } });
        toast.success('Producto actualizado');
      } else {
        await crearProducto({ variables: { input } });
        toast.success('Producto creado');
      }
      refetch();
      onClose();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{producto ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Código *</label>
              <input className="form-input" {...register('codigo', { required: 'Requerido' })} disabled={!!producto} placeholder="PROD001" />
              {errors.codigo && <span className="form-error">{errors.codigo.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <input className="form-input" {...register('categoria', { required: 'Requerido' })} placeholder="Lubricantes" list="cats" />
              <datalist id="cats">{categorias?.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" {...register('nombre', { required: 'Requerido' })} placeholder="Nombre del producto" />
            {errors.nombre && <span className="form-error">{errors.nombre.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" {...register('descripcion')} placeholder="Descripción opcional..." />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Unidad</label>
              <select className="form-select" {...register('unidad')}>
                <option value="unidad">Unidad</option>
                <option value="litro">Litro</option>
                <option value="kg">Kilogramo</option>
                <option value="metro">Metro</option>
                <option value="juego">Juego</option>
                <option value="caja">Caja</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stock Mínimo *</label>
              <input className="form-input" type="number" min="0" {...register('stockMinimo', { required: 'Requerido', min: 0 })} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Precio Compra *</label>
              <input className="form-input" type="number" min="0" {...register('precioCompra', { required: 'Requerido', min: 0 })} />
              {errors.precioCompra && <span className="form-error">{errors.precioCompra.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Precio Venta *</label>
              <input className="form-input" type="number" min="0" {...register('precioVenta', { required: 'Requerido', min: 0 })} />
              {errors.precioVenta && <span className="form-error">{errors.precioVenta.message}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={lc || la}>
              {lc || la ? '⏳ Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal kardex de producto
function ModalKardex({ producto, onClose }) {
  const { data, loading } = useQuery(GET_MOVIMIENTOS_PRODUCTO, { variables: { productoId: producto.id } });
  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <h3 className="modal-title">📋 Kardex: {producto.nombre}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Cant.</th><th>Precio</th><th>Stock Antes</th><th>Stock Después</th><th>Usuario</th></tr></thead>
              <tbody>
                {data?.movimientosProducto?.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(m.createdAt).toLocaleString('es-CO')}</td>
                    <td><span className={`badge ${m.tipo === 'ENTRADA' ? 'badge-info' : 'badge-danger'}`}>{m.tipo}</span></td>
                    <td>{m.cantidad}</td>
                    <td>{fmt(m.precioUnitario)}</td>
                    <td>{m.stockAntes}</td>
                    <td>{m.stockDespues}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{m.usuario?.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.movimientosProducto?.length === 0 && <div className="empty-state"><span className="empty-icon">📋</span><h3>Sin movimientos</h3></div>}
          </div>
        )}
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
}

export default function Productos() {
  const { isAdmin } = useAuth();
  const [modal, setModal] = useState(null); // null | 'crear' | producto obj
  const [kardexProducto, setKardexProducto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, loading, refetch } = useQuery(GET_PRODUCTOS, {
    variables: { busqueda: busqueda || undefined, categoria: categoria || undefined, pagina, limite: 10 },
    fetchPolicy: 'network-only',
  });
  const { data: cats } = useQuery(GET_CATEGORIAS);
  const [eliminarProducto] = useMutation(ELIMINAR_PRODUCTO);

  const handleEliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? El producto quedará inactivo.`)) return;
    try {
      await eliminarProducto({ variables: { id: p.id } });
      toast.success('Producto eliminado');
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const productos = data?.productos?.productos || [];
  const { total = 0, paginas = 1 } = data?.productos || {};

  const stockClass = (p) => {
    if (p.stockActual === 0) return 'stock-out';
    if (p.bajoStock) return 'stock-low';
    return 'stock-ok';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">{total} productos en total</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setModal('crear')}>➕ Nuevo Producto</button>}
      </div>

      <div className="card">
        <div className="search-bar">
          <input className="form-input search-input" placeholder="🔍 Buscar por nombre..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }} />
          <select className="form-select" style={{ width: 180 }} value={categoria} onChange={e => { setCategoria(e.target.value); setPagina(1); }}>
            <option value="">Todas las categorías</option>
            {cats?.categorias?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Precio Venta</th><th>Valor Inv.</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{p.codigo}</td>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className="badge badge-info">{p.categoria}</span></td>
                      <td>
                        <span className={stockClass(p)}>{p.stockActual} {p.unidad}</span>
                        {p.bajoStock && <span style={{ fontSize: '0.7rem', color: 'var(--warning)', display: 'block' }}>⚠️ Bajo mínimo ({p.stockMinimo})</span>}
                      </td>
                      <td>{fmt(p.precioVenta)}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(p.valorInventario)}</td>
                      <td><span className={`badge ${p.activo ? 'badge-success' : 'badge-danger'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" title="Kardex" onClick={() => setKardexProducto(p)}>📋</button>
                          {isAdmin && <button className="btn btn-ghost btn-sm btn-icon" title="Editar" onClick={() => setModal(p)}>✏️</button>}
                          {isAdmin && <button className="btn btn-ghost btn-sm btn-icon" title="Eliminar" onClick={() => handleEliminar(p)} style={{ color: 'var(--danger)' }}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productos.length === 0 && <div className="empty-state"><span className="empty-icon">📦</span><h3>Sin productos</h3></div>}
            </div>

            {paginas > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>← Anterior</button>
                {Array.from({ length: paginas }, (_, i) => (
                  <button key={i + 1} className={`page-btn ${pagina === i + 1 ? 'active' : ''}`} onClick={() => setPagina(i + 1)}>{i + 1}</button>
                ))}
                <button className="page-btn" disabled={pagina === paginas} onClick={() => setPagina(p => p + 1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>

      {(modal === 'crear' || (modal && modal.id)) && (
        <ModalProducto producto={modal === 'crear' ? null : modal} onClose={() => setModal(null)} categorias={cats?.categorias} refetch={refetch} />
      )}
      {kardexProducto && <ModalKardex producto={kardexProducto} onClose={() => setKardexProducto(null)} />}
    </div>
  );
}