const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

const sendError = (res, code, message, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
