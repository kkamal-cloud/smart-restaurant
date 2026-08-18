const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'kitchen', 'waiter').required(),
  isActive: Joi.boolean(),
});

const updateUserSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid('admin', 'kitchen', 'waiter'),
  isActive: Joi.boolean(),
});

module.exports = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
};
