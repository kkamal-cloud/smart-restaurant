const Joi = require('joi');

const createSessionSchema = Joi.object({
  tableId: Joi.string().required(),
  joinToken: Joi.string().optional().allow('', null),
  joinPin: Joi.string().optional().allow('', null),
  action: Joi.string().optional().allow('', null),
  customerName: Joi.string().required(),
  phone: Joi.string().optional().allow('', null),
}).unknown(true);

module.exports = {
  createSessionSchema,
};
