const { sendError } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let code = err.code || 'SERVER_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    code = 'VALIDATION_ERROR';
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    code = 'DUPLICATE_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found / Invalid ID';
    code = 'CAST_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    }
  });
};

module.exports = errorHandler;
