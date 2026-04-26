import { useState } from 'react';
import { useQuery } from '@apollo/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GET_MOVIMIENTOS, GET_PRODUCTOS } from '../graphql/queries.js';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtFecha = (d) => new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

export default function Kardex() {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState('');

  const { data: prods } = useQuery(GET_PRODUCTOS, { variables: { soloActivos: false, limite: 200 } });

  const { data, loading } = useQuery(GET_MOVIMIENTOS, {
    variables: { productoId: productoId || undefined, tipo: tipo || undefined, fechaInicio: fechaInicio || undefined, fechaFin: fechaFin || undefined, pagina, limite: 20 },
    fetchPolicy: 'network-only',
  });

  const { data: dataExport } = useQuery(GET_MOVIMIENTOS, {
    variables: { productoId: productoId || undefined, tipo: tipo || undefined, fechaInicio: fechaInicio || undefined, fechaFin: fechaFin || undefined, pagina: 1, limite: 10000 },
    fetchPolicy: 'network-only',
  });

  const movimientos = data?.movimientos?.movimientos || [];
  const todosMovimientos = dataExport?.movimientos?.movimientos || [];
  const { total = 0, paginas = 1 } = data?.movimientos || {};
  const productoSel = prods?.productos?.productos?.find(p => p.id === productoId);

  const entradas = movimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.cantidad, 0);
  const salidas = movimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.cantidad, 0);
  const valorEntradas = movimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.precioTotal, 0);
  const valorSalidas = movimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.precioTotal, 0);

  // ── Exportar Excel ──────────────────────────────────────────────────────────
  const exportarExcel = () => {
    setExportando('excel');
    try {
      const filas = todosMovimientos.map((m, i) => ({
        '#': i + 1,
        'Fecha': fmtFecha(m.createdAt),
        'Producto': m.producto?.nombre || '',
        'Código': m.producto?.codigo || '',
        'Tipo': m.tipo,
        'Cantidad': m.cantidad,
        'Precio Unitario': m.precioUnitario,
        'Total': m.precioTotal,
        'Stock Antes': m.stockAntes,
        'Stock Después': m.stockDespues,
        'Observación': m.observacion || '',
        'Registrado por': m.usuario?.nombre || '',
      }));

      const hoja = XLSX.utils.json_to_sheet(filas);
      hoja['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 28 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
        { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 18 },
      ];

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Kardex');

      const resumen = [
        ['REPORTE KARDEX'],
        ['Generado:', new Date().toLocaleString('es-CO')],
        ['Producto:', productoSel?.nombre || 'Todos'],
        ['Tipo:', tipo || 'Todos'],
        ['Período:', fechaInicio && fechaFin ? `${fechaInicio} al ${fechaFin}` : 'Sin filtro'],
        [],
        ['Total registros:', todosMovimientos.length],
        ['Total entradas (cant.):', todosMovimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.cantidad, 0)],
        ['Total salidas (cant.):', todosMovimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.cantidad, 0)],
        ['Valor entradas:', todosMovimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.precioTotal, 0)],
        ['Valor salidas:', todosMovimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.precioTotal, 0)],
      ];
      const hojaResumen = XLSX.utils.aoa_to_sheet(resumen);
      hojaResumen['!cols'] = [{ wch: 22 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen');

      XLSX.writeFile(libro, `kardex_${productoSel?.codigo || 'todos'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) { console.error(e); }
    finally { setExportando(''); }
  };

  // ── Exportar PDF ────────────────────────────────────────────────────────────
  const exportarPDF = () => {
    setExportando('pdf');
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFillColor(13, 15, 20);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(79, 142, 247);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE KARDEX', 14, 12);
      doc.setTextColor(136, 146, 164);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Inventario', 14, 19);
      doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 24);
      doc.setTextColor(232, 234, 240);
      doc.setFontSize(8);
      doc.text([
        `Producto: ${productoSel?.nombre || 'Todos'}`,
        `Tipo: ${tipo || 'Todos'}`,
        `Período: ${fechaInicio && fechaFin ? `${fechaInicio} al ${fechaFin}` : 'Sin filtro'}`,
        `Total: ${todosMovimientos.length} registros`,
      ].join('   |   '), 14, 29);

      doc.setFillColor(26, 30, 41);
      doc.rect(0, 32, 297, 16, 'F');
      const totalEnt = todosMovimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.cantidad, 0);
      const totalSal = todosMovimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.cantidad, 0);
      const valEnt = todosMovimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.precioTotal, 0);
      const valSal = todosMovimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.precioTotal, 0);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 211, 153); doc.text(`↑ Entradas: ${totalEnt} uds — ${fmt(valEnt)}`, 14, 41);
      doc.setTextColor(248, 113, 113); doc.text(`↓ Salidas: ${totalSal} uds — ${fmt(valSal)}`, 120, 41);
      doc.setTextColor(251, 191, 36); doc.text(`Balance: ${totalEnt - totalSal} uds`, 226, 41);

      autoTable(doc, {
        startY: 52,
        head: [['#', 'Fecha', 'Producto', 'Tipo', 'Cant.', 'Precio Unit.', 'Total', 'Stock Antes', 'Stock Después', 'Observación', 'Usuario']],
        body: todosMovimientos.map((m, i) => [
          i + 1, fmtFecha(m.createdAt), `${m.producto?.nombre} (${m.producto?.codigo})`,
          m.tipo, m.cantidad, fmt(m.precioUnitario), fmt(m.precioTotal),
          m.stockAntes, m.stockDespues, m.observacion || '—', m.usuario?.nombre || '',
        ]),
        styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [232, 234, 240], fillColor: [19, 22, 30], lineColor: [36, 40, 54], lineWidth: 0.2 },
        headStyles: { fillColor: [26, 30, 41], textColor: [136, 146, 164], fontStyle: 'bold', fontSize: 7, halign: 'center' },
        alternateRowStyles: { fillColor: [22, 26, 36] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 }, 1: { cellWidth: 28 }, 2: { cellWidth: 48 },
          3: { halign: 'center', cellWidth: 16 }, 4: { halign: 'center', cellWidth: 14 },
          5: { halign: 'right', cellWidth: 22 }, 6: { halign: 'right', cellWidth: 22 },
          7: { halign: 'center', cellWidth: 18 }, 8: { halign: 'center', cellWidth: 20 },
          9: { cellWidth: 34 }, 10: { cellWidth: 24 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            data.cell.styles.textColor = data.cell.raw === 'ENTRADA' ? [79, 142, 247] : [248, 113, 113];
          }
        },
        margin: { top: 52, left: 7, right: 7 },
      });

      const totalPags = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPags; i++) {
        doc.setPage(i);
        doc.setFillColor(13, 15, 20); doc.rect(0, 200, 297, 10, 'F');
        doc.setTextColor(136, 146, 164); doc.setFontSize(7);
        doc.text('Kardex Pro — Sistema de Inventario', 7, 206);
        doc.text(`Página ${i} de ${totalPags}`, 283, 206, { align: 'right' });
      }

      doc.save(`kardex_${productoSel?.codigo || 'todos'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) { console.error(e); }
    finally { setExportando(''); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kardex</h1>
          <p className="page-subtitle">Historial detallado de movimientos</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={exportarExcel} disabled={exportando === 'excel' || todosMovimientos.length === 0}>
            {exportando === 'excel' ? '⏳ Exportando...' : '📊 Exportar Excel'}
          </button>
          <button className="btn btn-ghost" onClick={exportarPDF} disabled={exportando === 'pdf' || todosMovimientos.length === 0}>
            {exportando === 'pdf' ? '⏳ Exportando...' : '📄 Exportar PDF'}
          </button>
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
            <div className="stat-sub" style={{ color: 'var(--accent)' }}>{fmt(valorEntradas)}</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">↓ Salidas (cantidad)</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{salidas}</div>
            <div className="stat-sub" style={{ color: 'var(--danger)' }}>{fmt(valorSalidas)}</div>
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

      {/* Tabla */}
      <div className="card">
        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Precio Unit.</th><th>Total</th><th>Stock Antes</th><th>Stock Después</th><th>Observación</th><th>Registrado por</th></tr>
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