import mongoose from 'mongoose';

const movimientoSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  tipo: { type: String, enum: ['ENTRADA', 'SALIDA'], required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precioUnitario: { type: Number, required: true, min: 0 },
  precioTotal: { type: Number, required: true, min: 0 },
  stockAntes: { type: Number, required: true, min: 0 },
  stockDespues: { type: Number, required: true, min: 0 },
  observacion: { type: String, trim: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { timestamps: true });

// Índices para reportes y filtros
movimientoSchema.index({ producto: 1, createdAt: -1 });
movimientoSchema.index({ tipo: 1 });
movimientoSchema.index({ createdAt: -1 });

export const Movimiento = mongoose.model('Movimiento', movimientoSchema);