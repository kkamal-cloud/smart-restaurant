const Joi = require('joi');

const processPaymentSchema = Joi.object({
  billId: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'card', 'upi').required(),
  reference: Joi.string().allow('', null),
});

module.exports = {
  processPaymentSchema,
};
