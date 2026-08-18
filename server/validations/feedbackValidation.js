const Joi = require('joi');

const submitFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('', null),
});

module.exports = {
  submitFeedbackSchema,
};
