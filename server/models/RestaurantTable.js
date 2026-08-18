const mongoose = require('mongoose');

const restaurantTableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  location: { type: String, required: true },
  qrToken: { type: String, required: true, unique: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RestaurantTable', restaurantTableSchema);
