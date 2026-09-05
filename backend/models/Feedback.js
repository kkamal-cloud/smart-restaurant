const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSession', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
