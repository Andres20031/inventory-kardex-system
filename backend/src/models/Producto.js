import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  categoria: { type: String, required: true, trim: true },
  unidad: { type: String, required: true, default: 'unidad' }, // unidad, kg, litro, etc.
  stockActual: { type: Number, default: 0, min: 0 },
  stockMinimo: { type: Number, required: true, default: 5, min: 0 },
  precioCompra: { type: Number, required: true, min: 0 },   // precio costo
  precioVenta: { type: Number, required: true, min: 0 },    // precio venta
  precioPromedio: { type: Number, default: 0, min: 0 },     // precio promedio ponderado
  imagen: { type: String },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

// Índices para búsquedas eficientes
productoSchema.index({ codigo: 1 });
productoSchema.index({ nombre: 'text', descripcion: 'text' });
productoSchema.index({ categoria: 1 });

export const Producto = mongoose.model('Producto', productoSchema);