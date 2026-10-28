const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle specific known error types
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new ApiError(400, message);
  } else if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    const field = fields[0] || 'field';
    const message = `A record with this ${field} already exists`;
    error = new ApiError(409, message, [{ field, message }]);
  } else if (err.name === 'ValidationError') {
    const extractedErrors = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message
    }));
    error = new ApiError(400, 'Validation Error', extractedErrors);
  } else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token expired');
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ApiError(400, 'File upload exceeds size limit of 5MB');
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    statusCode,
    message: error.message || 'An unexpected error occurred',
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
