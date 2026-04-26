import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  rol: { type: String, enum: ['admin', 'operador'], default: 'operador' },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password antes de guardar
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Método para comparar password
usuarioSchema.methods.compararPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export const Usuario = mongoose.model('Usuario', usuarioSchema);