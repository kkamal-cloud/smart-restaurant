const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
});

const createFoodSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  isAvailable: Joi.boolean(),
  isVeg: Joi.boolean(),
});

const updateFoodSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string(),
  isAvailable: Joi.boolean(),
  isVeg: Joi.boolean(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createFoodSchema,
  updateFoodSchema,
};
