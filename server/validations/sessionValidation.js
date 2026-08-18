const Joi = require('joi');

const createSessionSchema = Joi.object({
  tableId: Joi.string().required(),
  joinToken: Joi.string().optional(),
  customerName: Joi.string().required(),
  phone: Joi.string().optional(),
});

module.exports = {
  createSessionSchema,
};
