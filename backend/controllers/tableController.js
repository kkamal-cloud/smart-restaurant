const crypto = require('crypto');
const RestaurantTable = require('../models/RestaurantTable');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { createTableSchema, updateTableSchema } = require('../validations/tableValidation');

exports.getTables = async (req, res, next) => {
  try {
    const tables = await RestaurantTable.find();
    sendSuccess(res, tables);
  } catch (err) {
    next(err);
  }
};

exports.createTable = async (req, res, next) => {
  try {
    const { error } = createTableSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const qrToken = crypto.randomBytes(16).toString('hex');
    const table = await RestaurantTable.create({ ...req.body, qrToken });
    sendSuccess(res, table, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateTable = async (req, res, next) => {
  try {
    const { error } = updateTableSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const table = await RestaurantTable.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!table) return sendError(res, 'NOT_FOUND', 'Table not found', 404);
    
    sendSuccess(res, table);
  } catch (err) {
    next(err);
  }
};

exports.generateQr = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findById(req.params.tableId);
    if (!table) return sendError(res, 'NOT_FOUND', 'Table not found', 404);

    table.qrToken = crypto.randomBytes(16).toString('hex');
    await table.save();
    sendSuccess(res, { qrToken: table.qrToken });
  } catch (err) {
    next(err);
  }
};

exports.getQrDetails = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findOne({ qrToken: req.params.token });
    if (!table) return sendError(res, 'NOT_FOUND', 'Invalid QR token', 404);

    sendSuccess(res, {
      id: table._id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      isAvailable: table.isAvailable
    });
  } catch (err) {
    next(err);
  }
};
