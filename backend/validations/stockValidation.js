const Joi = require('joi');

const restockSchema = Joi.object({
  foodId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

module.exports = {
  restockSchema,
};
