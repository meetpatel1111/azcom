const config = require('../config');

/**
 * Global error handling middleware
 * Handles all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Validation Error',
      message: err.message,
      details: err.details || []
    };
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse = {
      error: 'Unauthorized',
      message: err.message || 'Authentication required'
    };
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse = {
      error: 'Forbidden',
      message: err.message || 'Access denied'
    };
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorResponse = {
      error: 'Not Found',
      message: err.message || 'Resource not found'
    };
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    errorResponse = {
      error: 'Conflict',
      message: err.message || 'Resource conflict'
    };
  } else if (err.statusCode) {
    // Custom error with status code
    statusCode = err.statusCode;
    errorResponse = {
      error: err.name || 'Error',
      message: err.message
    };
  }

  // Add stack trace in development
  if (config.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};