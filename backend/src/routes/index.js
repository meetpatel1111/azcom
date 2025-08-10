const express = require('express');
const { healthCheck } = require('../middleware/logging');

const router = express.Router();

/**
 * API Routes Index
 * Defines all API route prefixes and health check
 */

// Health check endpoint
router.get('/health', healthCheck);

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    api: 'Online Shopping Platform API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      users: '/api/users'
    }
  });
});

// Mount route modules
router.use('/auth', require('./auth'));
router.use('/products', require('./products'));
router.use('/cart', require('./cart'));
router.use('/orders', require('./orders'));
router.use('/users', require('./users'));

module.exports = router;