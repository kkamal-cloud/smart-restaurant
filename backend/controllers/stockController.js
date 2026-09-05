const Stock = require('../models/Stock');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { restockSchema } = require('../validations/stockValidation');

exports.getStock = async (req, res, next) => {
  try {
    const stock = await Stock.find().populate({
      path: 'food',
      select: 'name isAvailable category',
      populate: { path: 'category', select: 'name' }
    });
    const result = stock.map(s => ({
      ...s.toObject(),
      isLow: s.quantity <= s.lowStockThreshold
    }));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

exports.getStockAlerts = async (req, res, next) => {
  try {
    const stock = await Stock.find().populate({
      path: 'food',
      select: 'name isAvailable category',
      populate: { path: 'category', select: 'name' }
    });
    const alerts = stock.filter(s => s.quantity <= s.lowStockThreshold);
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
};

exports.restock = async (req, res, next) => {
  try {
    const { error } = restockSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { foodId, quantity } = req.body;
    const stock = await Stock.findOneAndUpdate(
      { food: foodId },
      { $inc: { quantity: quantity } },
      { returnDocument: 'after' }
    );

    if (!stock) return sendError(res, 'NOT_FOUND', 'Stock not found for this food', 404);

    sendSuccess(res, stock);
  } catch (err) {
    next(err);
  }
};
