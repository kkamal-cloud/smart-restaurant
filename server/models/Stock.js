const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  lowStockThreshold: { type: Number, required: true, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
