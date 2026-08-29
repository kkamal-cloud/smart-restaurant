const Joi = require('joi');

const createTableSchema = Joi.object({
  tableNumber: Joi.string().required(),
  capacity: Joi.number().integer().min(1).required(),
  location: Joi.string().required(),
  isAvailable: Joi.boolean(),
});

const updateTableSchema = Joi.object({
  tableNumber: Joi.string(),
  capacity: Joi.number().integer().min(1),
  location: Joi.string(),
  isAvailable: Joi.boolean(),
});

module.exports = {
  createTableSchema,
  updateTableSchema,
};
