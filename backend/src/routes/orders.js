const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const Joi = require('joi');
const { 
  createOrderSchema,
  updateOrderStatusSchema 
} = require('../models/Order');
const {
  createOrderFromCart,
  updateOrderStatus,
  cancelOrder,
  validateOrderCreation,
  getUserOrderHistory,
  getOrderById,
  getOrderTracking,
  getRecentOrders,
  getUserOrderSummary,
  reorderFromOrder,
  getProcessingStats
} = require('../controllers/orderController');

const router = express.Router();

/**
 * Order Processing Routes
 * All routes are prefixed with /api/orders
 */

// Validation schemas for query parameters
const orderHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  sortBy: Joi.string().valid('createdAt', 'totalAmount', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const recentOrdersSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(5)
});

/**
 * @route   POST /api/orders
 * @desc    Create order from cart contents
 * @access  Private
 */
router.post('/', authenticateToken, validateBody(createOrderSchema), createOrderFromCart);

/**
 * @route   POST /api/orders/validate
 * @desc    Validate order before creation (dry run)
 * @access  Private
 */
router.post('/validate', authenticateToken, validateBody(createOrderSchema), validateOrderCreation);

/**
 * @route   GET /api/orders/processing-stats
 * @desc    Get order processing statistics
 * @access  Private (Admin only)
 */
router.get('/processing-stats', authenticateToken, requireAdmin, getProcessingStats);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private
 */
router.patch('/:id/status', authenticateToken, validateBody(updateOrderStatusSchema), updateOrderStatus);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.post('/:id/cancel', authenticateToken, cancelOrder);

/**
 * Order History Routes
 */

/**
 * @route   GET /api/orders
 * @desc    Get user's order history with pagination and filtering
 * @access  Private
 */
router.get('/', authenticateToken, getUserOrderHistory);

/**
 * @route   GET /api/orders/recent
 * @desc    Get recent orders
 * @access  Private
 */
router.get('/recent', authenticateToken, getRecentOrders);

/**
 * @route   GET /api/orders/summary
 * @desc    Get user's order summary
 * @access  Private
 */
router.get('/summary', authenticateToken, getUserOrderSummary);

/**
 * @route   GET /api/orders/:id
 * @desc    Get specific order details
 * @access  Private
 */
router.get('/:id', authenticateToken, getOrderById);

/**
 * @route   GET /api/orders/:id/tracking
 * @desc    Get order tracking information
 * @access  Private
 */
router.get('/:id/tracking', authenticateToken, getOrderTracking);

/**
 * @route   POST /api/orders/:id/reorder
 * @desc    Reorder from previous order
 * @access  Private
 */
router.post('/:id/reorder', authenticateToken, reorderFromOrder);

module.exports = router;