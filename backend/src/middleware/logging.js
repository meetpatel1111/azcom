const config = require('../config');

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log request start
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${new Date().toISOString()}] ${logLevel} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Security headers middleware
 * Adds security-related headers to responses
 */
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });

  next();
};

/**
 * Request ID middleware
 * Adds unique request ID to each request for tracing
 */
const requestId = (req, res, next) => {
  const id = Math.random().toString(36).substring(2, 15) + 
            Math.random().toString(36).substring(2, 15);
  
  req.requestId = id;
  res.set('X-Request-ID', id);
  
  next();
};

/**
 * Health check middleware
 * Provides a simple health check endpoint
 */
const healthCheck = (req, res) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  
  res.json({
    status: 'healthy',
    timestamp,
    uptime: `${Math.floor(uptime)}s`,
    environment: config.nodeEnv,
    version: '1.0.0'
  });
};

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.corsOrigin,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
};

module.exports = {
  requestLogger,
  securityHeaders,
  requestId,
  healthCheck,
  corsOptions
};