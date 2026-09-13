const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: Number, unique: true, sparse: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSession', required: true },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  specialInstructions: { type: String },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'] },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

orderSchema.index({ session: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
