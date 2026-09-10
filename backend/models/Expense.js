const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  category: { type: String, default: 'General', trim: true },
}, { timestamps: true });

expenseSchema.index({ date: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
