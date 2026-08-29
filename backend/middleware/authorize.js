const { sendError } = require('../utils/responseFormatter');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', `Role (${req.user?.role || 'Guest'}) is not allowed to access this resource`, 403);
    }
    next();
  };
};

module.exports = authorize;
