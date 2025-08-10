const { ValidationError } = require('./errorHandler');

/**
 * Request validation middleware factory
 * Creates middleware to validate request data using Joi schemas
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return next(new ValidationError('Validation failed', details));
    }

    // Replace request data with validated/sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Validate request body
 */
const validateBody = (schema) => validateRequest(schema, 'body');

/**
 * Validate request query parameters
 */
const validateQuery = (schema) => validateRequest(schema, 'query');

/**
 * Validate request parameters
 */
const validateParams = (schema) => validateRequest(schema, 'params');

/**
 * Sanitize request data by removing undefined/null values
 */
const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined || obj[key] === null) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  next();
};

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [id, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(id);
      } else {
        requests.set(id, validTimestamps);
      }
    }

    // Check current client
    const clientRequests = requests.get(clientId) || [];
    const validRequests = clientRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(clientId, validRequests);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - validRequests.length),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });

    next();
  };
};

module.exports = {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  sanitizeRequest,
  createRateLimit
};