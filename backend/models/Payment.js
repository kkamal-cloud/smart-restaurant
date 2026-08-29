const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'card', 'upi'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  reference: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
