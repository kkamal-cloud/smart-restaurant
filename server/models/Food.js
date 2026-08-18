const mongoose = require('mongoose');
const Stock = require('./Stock');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

foodSchema.post('save', async function(doc, next) {
  // Only create stock if it doesn't exist (e.g. on creation)
  try {
    const existingStock = await Stock.findOne({ food: doc._id });
    if (!existingStock) {
      await Stock.create({ food: doc._id, quantity: 100, lowStockThreshold: 10 });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Food', foodSchema);
