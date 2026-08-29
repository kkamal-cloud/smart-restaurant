const Joi = require('joi');

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('preparing', 'ready', 'served').required(),
});

module.exports = {
  updateOrderStatusSchema,
};
