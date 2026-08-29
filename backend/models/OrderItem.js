const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtOrderTime: { type: Number, required: true, min: 0 },
  specialInstructions: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
