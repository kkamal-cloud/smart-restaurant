const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CustomerSession = require('../models/CustomerSession');
const { sendError } = require('../utils/responseFormatter');

const authenticate = async (req, res, next) => {
  let token;
  // Check for admin/staff token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || !req.user.isActive) {
        return sendError(res, 'AUTH_FAILED', 'User not found or inactive', 401);
      }
      return next();
    } catch (error) {
      return sendError(res, 'AUTH_FAILED', 'Not authorized, token failed', 401);
    }
  }

  // Check for session joinToken (for customer endpoints)
  if (req.headers['x-join-token']) {
    try {
      const joinToken = req.headers['x-join-token'];
      const session = await CustomerSession.findOne({ joinToken, status: 'active' });
      if (!session) {
        return sendError(res, 'AUTH_FAILED', 'Invalid or expired session token', 401);
      }
      req.session = session; // Attach session to request
      return next();
    } catch (error) {
      return sendError(res, 'AUTH_FAILED', 'Not authorized, session token failed', 401);
    }
  }

  if (!token && !req.session) {
    return sendError(res, 'AUTH_FAILED', 'Not authorized, no token provided', 401);
  }
};

module.exports = authenticate;
