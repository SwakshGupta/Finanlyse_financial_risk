const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const requestId = req.id || `req_unknown`;
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected internal error occurred';
  let details = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details || [];
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid token signature';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Token has expired';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Malformed JSON in request body';
  } else if (err.code === '23505') { // Postgres unique_violation
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    code = 'SERVICE_UNAVAILABLE';
    message = 'Database or dependent service connection refused';
  }

  // Log 500 errors
  if (statusCode >= 500) {
    console.error(`[Error] [${requestId}] ${statusCode} - ${message}:`, err);
  }

  const responseBody = {
    error: {
      code,
      message,
      requestId
    }
  };

  if (details && details.length > 0) {
    responseBody.error.details = details;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = errorHandler;
