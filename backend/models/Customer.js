const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSession' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
