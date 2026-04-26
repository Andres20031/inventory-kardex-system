import 'dotenv/config';
import mongoose from 'mongoose';
import { Usuario } from './models/Usuario.js';
import { Producto } from './models/Producto.js';
import { Movimiento } from './models/Movimiento.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB');

// Limpiar colecciones
await Promise.all([Usuario.deleteMany(), Producto.deleteMany(), Movimiento.deleteMany()]);
console.log('🗑️  Colecciones limpiadas');

// Crear usuarios
const admin = await Usuario.create({ nombre: 'Admin Principal', email: 'admin@kardex.com', password: 'admin123', rol: 'admin' });
const operador = await Usuario.create({ nombre: 'Juan Operador', email: 'operador@kardex.com', password: 'operador123', rol: 'operador' });
console.log('👤 Usuarios creados');

// Crear productos
const productos = await Producto.insertMany([
  { codigo: 'PROD001', nombre: 'Aceite Motor 5W-30', categoria: 'Lubricantes', unidad: 'litro', stockMinimo: 10, precioCompra: 15000, precioVenta: 22000, precioPromedio: 15000 },
  { codigo: 'PROD002', nombre: 'Filtro de Aceite', categoria: 'Filtros', unidad: 'unidad', stockMinimo: 5, precioCompra: 8000, precioVenta: 14000, precioPromedio: 8000 },
  { codigo: 'PROD003', nombre: 'Pastillas de Freno', categoria: 'Frenos', unidad: 'juego', stockMinimo: 3, precioCompra: 45000, precioVenta: 70000, precioPromedio: 45000 },
  { codigo: 'PROD004', nombre: 'Batería 12V 60Ah', categoria: 'Eléctrico', unidad: 'unidad', stockMinimo: 2, precioCompra: 180000, precioVenta: 250000, precioPromedio: 180000 },
  { codigo: 'PROD005', nombre: 'Líquido de Frenos DOT4', categoria: 'Líquidos', unidad: 'litro', stockMinimo: 8, precioCompra: 12000, precioVenta: 18000, precioPromedio: 12000 },
  { codigo: 'PROD006', nombre: 'Correa de Distribución', categoria: 'Motor', unidad: 'unidad', stockMinimo: 3, precioCompra: 35000, precioVenta: 55000, precioPromedio: 35000 },
]);
console.log('📦 Productos creados');

// Crear movimientos de entrada para dar stock inicial
const movimientosEntrada = productos.map(p => ({
  producto: p._id,
  tipo: 'ENTRADA',
  cantidad: 20,
  precioUnitario: p.precioCompra,
  precioTotal: 20 * p.precioCompra,
  stockAntes: 0,
  stockDespues: 20,
  observacion: 'Stock inicial',
  usuario: admin._id,
}));

await Movimiento.insertMany(movimientosEntrada);

// Actualizar stock de productos
await Promise.all(productos.map(p => Producto.findByIdAndUpdate(p._id, { stockActual: 20 })));

// Crear algunas salidas de ejemplo
await Movimiento.create({
  producto: productos[0]._id,
  tipo: 'SALIDA',
  cantidad: 3,
  precioUnitario: productos[0].precioVenta,
  precioTotal: 3 * productos[0].precioVenta,
  stockAntes: 20,
  stockDespues: 17,
  observacion: 'Venta cliente',
  usuario: operador._id,
});
await Producto.findByIdAndUpdate(productos[0]._id, { stockActual: 17 });

await Movimiento.create({
  producto: productos[1]._id,
  tipo: 'SALIDA',
  cantidad: 5,
  precioUnitario: productos[1].precioVenta,
  precioTotal: 5 * productos[1].precioVenta,
  stockAntes: 20,
  stockDespues: 15,
  observacion: 'Mantenimiento vehículos',
  usuario: operador._id,
});
await Producto.findByIdAndUpdate(productos[1]._id, { stockActual: 15 });

console.log('📊 Movimientos creados');
console.log('\n✅ Seed completado exitosamente!');
console.log('\n🔑 Credenciales de prueba:');
console.log('   Admin:    admin@kardex.com / admin123');
console.log('   Operador: operador@kardex.com / operador123\n');

await mongoose.disconnect();
process.exit(0);