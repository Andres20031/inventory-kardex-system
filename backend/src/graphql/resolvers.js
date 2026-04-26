import { Usuario } from '../models/Usuario.js';
import { Producto } from '../models/Producto.js';
import { Movimiento } from '../models/Movimiento.js';
import { generarToken, requireAuth, requireAdmin } from '../utils/auth.js';
import mongoose from 'mongoose';

export const resolvers = {
  // ── Campos calculados en Producto ──────────────────────────────────────────
  Producto: {
    bajoStock: (p) => p.stockActual <= p.stockMinimo,
    valorInventario: (p) => p.stockActual * p.precioPromedio,
  },

  // ── QUERIES ────────────────────────────────────────────────────────────────
  Query: {
    // Devuelve el usuario autenticado
    yo: async (_, __, { usuario }) => {
      requireAuth(usuario);
      return Usuario.findById(usuario.id);
    },

    // Listado paginado de productos con filtros
    productos: async (_, { busqueda, categoria, soloActivos = true, bajoStock, pagina = 1, limite = 10 }) => {
      const filtro = {};

      if (soloActivos) filtro.activo = true;
      if (categoria) filtro.categoria = categoria;
      if (busqueda) filtro.$text = { $search: busqueda };

      // 🔥 ESTE ES EL FIX IMPORTANTE
      if (bajoStock) {
        filtro.$expr = {
          $lte: ['$stockActual', '$stockMinimo']
        };
      }

      const skip = (pagina - 1) * limite;

      const [productos, total] = await Promise.all([
        Producto.find(filtro)
          .sort({ nombre: 1 })
          .skip(skip)
          .limit(limite),
        Producto.countDocuments(filtro)
      ]);

      return {
        productos,
        total,
        paginas: Math.ceil(total / limite),
        pagina
      };
    },

    producto: async (_, { id }) => Producto.findById(id),

    categorias: async () => {
      const cats = await Producto.distinct('categoria', { activo: true });
      return cats.sort();
    },

    // Movimientos paginados con filtros
    movimientos: async (_, { productoId, tipo, fechaInicio, fechaFin, pagina = 1, limite = 20 }) => {
      const filtro = {};
      if (productoId) filtro.producto = productoId;
      if (tipo) filtro.tipo = tipo;
      if (fechaInicio || fechaFin) {
        filtro.createdAt = {};
        if (fechaInicio) filtro.createdAt.$gte = new Date(fechaInicio);
        if (fechaFin) filtro.createdAt.$lte = new Date(fechaFin + 'T23:59:59');
      }

      const skip = (pagina - 1) * limite;
      const [movimientos, total] = await Promise.all([
        Movimiento.find(filtro).populate('producto').populate('usuario').sort({ createdAt: -1 }).skip(skip).limit(limite),
        Movimiento.countDocuments(filtro),
      ]);

      return { movimientos, total, paginas: Math.ceil(total / limite), pagina };
    },

    movimientosProducto: async (_, { productoId }) =>
      Movimiento.find({ producto: productoId }).populate('producto').populate('usuario').sort({ createdAt: -1 }),

    // Stats del dashboard
    dashboardStats: async () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const [
        totalProductos, productosActivos, todosProductos,
        totalMovimientosHoy, entradasHoy, salidasHoy,
      ] = await Promise.all([
        Producto.countDocuments(),
        Producto.countDocuments({ activo: true }),
        Producto.find({ activo: true }, 'stockActual stockMinimo precioPromedio'),
        Movimiento.countDocuments({ createdAt: { $gte: hoy, $lt: manana } }),
        Movimiento.countDocuments({ tipo: 'ENTRADA', createdAt: { $gte: hoy, $lt: manana } }),
        Movimiento.countDocuments({ tipo: 'SALIDA', createdAt: { $gte: hoy, $lt: manana } }),
      ]);

      const productosBajoStock = todosProductos.filter(p => p.stockActual <= p.stockMinimo).length;
      const valorTotalInventario = todosProductos.reduce((acc, p) => acc + p.stockActual * p.precioPromedio, 0);

      return { totalProductos, productosActivos, productosBajoStock, totalMovimientosHoy, entradasHoy, salidasHoy, valorTotalInventario };
    },

    // Resumen mensual de movimientos (últimos 6 meses)
    resumenMovimientosMensual: async () => {
      const hace6Meses = new Date();
      hace6Meses.setMonth(hace6Meses.getMonth() - 5);
      hace6Meses.setDate(1);
      hace6Meses.setHours(0, 0, 0, 0);

      const resultado = await Movimiento.aggregate([
        { $match: { createdAt: { $gte: hace6Meses } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, tipo: '$tipo' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Transformar para el frontend
      const meses = {};
      const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      resultado.forEach(({ _id, count }) => {
        const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
        if (!meses[key]) meses[key] = { mes: `${nombresMes[_id.month - 1]} ${_id.year}`, entradas: 0, salidas: 0 };
        if (_id.tipo === 'ENTRADA') meses[key].entradas = count;
        else meses[key].salidas = count;
      });

      return Object.values(meses);
    },
  },

  // ── MUTATIONS ──────────────────────────────────────────────────────────────
  Mutation: {
    // Login
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const usuario = await Usuario.findOne({ email, activo: true });
      if (!usuario) throw new Error('Credenciales inválidas');
      const valido = await usuario.compararPassword(password);
      if (!valido) throw new Error('Credenciales inválidas');
      const token = generarToken(usuario);
      return { token, usuario };
    },

    // Crear usuario (solo admin)
    crearUsuario: async (_, { input }, { usuario }) => {
      requireAdmin(usuario);
      const existe = await Usuario.findOne({ email: input.email });
      if (existe) throw new Error('Ya existe un usuario con ese email');
      return Usuario.create(input);
    },

    // Crear producto
    crearProducto: async (_, { input }, { usuario }) => {
      requireAuth(usuario);
      const existe = await Producto.findOne({ codigo: input.codigo.toUpperCase() });
      if (existe) throw new Error(`Ya existe un producto con el código ${input.codigo}`);
      return Producto.create({ ...input, precioPromedio: input.precioCompra });
    },

    // Actualizar producto
    actualizarProducto: async (_, { id, input }, { usuario }) => {
      requireAuth(usuario);
      const producto = await Producto.findByIdAndUpdate(id, input, { new: true, runValidators: true });
      if (!producto) throw new Error('Producto no encontrado');
      return producto;
    },

    // Eliminar producto (soft delete)
    eliminarProducto: async (_, { id }, { usuario }) => {
      requireAdmin(usuario);
      await Producto.findByIdAndUpdate(id, { activo: false });
      return true;
    },

    // Restaurar producto eliminado
    restaurarProducto: async (_, { id }, { usuario }) => {
      requireAdmin(usuario);
      const producto = await Producto.findByIdAndUpdate(id, { activo: true }, { new: true });
      if (!producto) throw new Error('Producto no encontrado');
      return producto;
    },

    // ⭐ Crear movimiento (lógica de kardex)
    crearMovimiento: async (_, { input }, { usuario }) => {
      requireAuth(usuario);

      const { productoId, tipo, cantidad, precioUnitario, observacion } = input;

      const producto = await Producto.findById(productoId);
      if (!producto || !producto.activo) {
        throw new Error('Producto no encontrado o inactivo');
      }

      const stockAntes = producto.stockActual;
      let stockDespues;
      let nuevoPrecioPromedio = producto.precioPromedio;

      if (tipo === 'ENTRADA') {
        stockDespues = stockAntes + cantidad;

        // 🔥 PROMEDIO PONDERADO (bien hecho)
        const valorAnterior = stockAntes * producto.precioPromedio;
        const valorNuevo = cantidad * precioUnitario;

        nuevoPrecioPromedio =
          stockDespues > 0
            ? (valorAnterior + valorNuevo) / stockDespues
            : precioUnitario;

      } else if (tipo === 'SALIDA') {
        if (stockAntes < cantidad) {
          throw new Error(
            `Stock insuficiente. Stock actual: ${stockAntes}, cantidad solicitada: ${cantidad}`
          );
        }

        stockDespues = stockAntes - cantidad;

      } else {
        throw new Error('Tipo inválido');
      }

      // ✅ Actualizar producto
      await Producto.findByIdAndUpdate(productoId, {
        stockActual: stockDespues,
        precioPromedio: nuevoPrecioPromedio,
      });

      // ✅ Crear movimiento
      const movimiento = await Movimiento.create({
        producto: productoId,
        tipo,
        cantidad,
        precioUnitario,
        precioTotal: cantidad * precioUnitario,
        stockAntes,
        stockDespues,
        observacion,
        usuario: usuario.id,
      });

      return Movimiento.findById(movimiento._id)
        .populate('producto')
        .populate('usuario');
    }
  },
};