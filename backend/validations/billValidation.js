const Joi = require('joi');

const createBillSchema = Joi.object({
  sessionId: Joi.string().required(),
  taxRate: Joi.number().min(0).default(5),
  discount: Joi.number().min(0).default(0),
});

module.exports = {
  createBillSchema,
};
