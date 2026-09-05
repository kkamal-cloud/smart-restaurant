const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { loginSchema, createUserSchema, updateUserSchema } = require('../validations/authValidation');

exports.login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return sendError(res, 'AUTH_FAILED', 'Invalid credentials or inactive user', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'AUTH_FAILED', 'Invalid credentials', 401);
    }

    const token = generateToken(user._id);
    sendSuccess(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    sendSuccess(res, { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { name, email, password, role, isActive } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 'DUPLICATE_ERROR', 'Email already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword, role, isActive });
    sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role }, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { error } = updateUserSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { name, email, password, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return sendError(res, 'NOT_FOUND', 'User not found', 404);

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) {
      if (!isActive && req.user.id === user.id.toString()) {
         return sendError(res, 'FORBIDDEN', 'Cannot deactivate yourself', 403);
      }
      user.isActive = isActive;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
  } catch (err) {
    next(err);
  }
};
