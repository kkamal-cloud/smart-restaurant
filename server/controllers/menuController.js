const Category = require('../models/Category');
const Food = require('../models/Food');
const Stock = require('../models/Stock');
const OrderItem = require('../models/OrderItem');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { createCategorySchema, updateCategorySchema, createFoodSchema, updateFoodSchema } = require('../validations/menuValidation');

exports.getCategories = async (req, res, next) => {
  try {
    const filter = req.user ? {} : { isActive: true }; // Admin gets all, public gets active
    const categories = await Category.find(filter).sort('sortOrder');
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { error } = createCategorySchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);
    
    const category = await Category.create(req.body);
    sendSuccess(res, category, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { error } = updateCategorySchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);
    
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return sendError(res, 'NOT_FOUND', 'Category not found', 404);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
};

exports.getFoods = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = req.user ? {} : { isAvailable: true };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const foods = await Food.find(filter).populate('category', 'name');
    sendSuccess(res, foods);
  } catch (err) {
    next(err);
  }
};

exports.getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id).populate('category', 'name');
    if (!food) return sendError(res, 'NOT_FOUND', 'Food not found', 404);
    sendSuccess(res, food);
  } catch (err) {
    next(err);
  }
};

exports.createFood = async (req, res, next) => {
  try {
    const { error } = createFoodSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);
    
    const food = await Food.create(req.body);
    
    sendSuccess(res, food, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateFood = async (req, res, next) => {
  try {
    const { error } = updateFoodSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!food) return sendError(res, 'NOT_FOUND', 'Food not found', 404);
    
    sendSuccess(res, food);
  } catch (err) {
    next(err);
  }
};

exports.deleteFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    // Check if food is in any past order_item
    const orderItemCount = await OrderItem.countDocuments({ food: foodId });
    if (orderItemCount > 0) {
      return sendError(res, 'FORBIDDEN', 'Cannot delete food item as it is linked to past orders. Consider setting isAvailable to false instead.', 403);
    }
    
    await Stock.deleteOne({ food: foodId });
    const food = await Food.findByIdAndDelete(foodId);
    if (!food) return sendError(res, 'NOT_FOUND', 'Food not found', 404);

    sendSuccess(res, { message: 'Food deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'VALIDATION_ERROR', 'No image file provided');
    const food = await Food.findById(req.params.id);
    if (!food) return sendError(res, 'NOT_FOUND', 'Food not found', 404);

    food.image = `/uploads/${req.file.filename}`;
    await food.save();
    
    sendSuccess(res, food);
  } catch (err) {
    next(err);
  }
};
