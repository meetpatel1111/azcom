const express = require('express');
const cors = require('cors');
const config = require('./config');

// Middleware imports
const { requestLogger, securityHeaders, requestId, corsOptions } = require('./middleware/logging');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeRequest, createRateLimit } = require('./middleware/validation');

// Route imports
const apiRoutes = require('./routes');

/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */
const app = express();

// Trust proxy for accurate IP addresses (if behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(requestId);

// CORS configuration
app.use(cors(corsOptions));

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(requestLogger);
}

// Rate limiting (more restrictive for auth endpoints)
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10)); // 10 requests per 15 minutes for auth
app.use('/api', createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes for API

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(sanitizeRequest);

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Online Shopping Platform API',
    version: '1.0.0',
    documentation: '/api/status',
    health: '/api/health'
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;