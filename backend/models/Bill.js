const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSession', required: true },
  orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  items: [{
    foodName: String,
    quantity: Number,
    price: Number,
    total: Number,
  }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
