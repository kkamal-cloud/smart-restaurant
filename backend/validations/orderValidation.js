const Joi = require('joi');

const createOrderSchema = Joi.object({
  sessionId: Joi.string().required(),
  items: Joi.array().items(Joi.object({
    foodId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    specialInstructions: Joi.string().allow('', null)
  })).min(1).required(),
  specialInstructions: Joi.string().allow('', null)
});

module.exports = {
  createOrderSchema,
};
