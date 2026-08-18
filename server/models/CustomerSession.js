const mongoose = require('mongoose');

const customerSessionSchema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantTable', required: true },
  customerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  joinToken: { type: String, required: true, unique: true },
  totalAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CustomerSession', customerSessionSchema);
