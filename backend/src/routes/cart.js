const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../middleware/validation');
const Joi = require('joi');
const { 
  addToCartSchema,
  updateCartItemSchema 
} = require('../models/Cart');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  updateMultipleItems,
  getCartSummary,
  validateCart,
  getCartItemCount,
  getCartItem,
  getRecentItems,
  clearCart,
  syncCart
} = require('../controllers/cartController');

const router = express.Router();

/**
 * Cart Routes
 * All routes are prefixed with /api/cart
 * All routes require authentication
 */

// Validation schemas
const recentItemsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(5)
});

const productIdSchema = Joi.object({
  productId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'Product ID must be a valid UUID'
  })
});

const bulkUpdateSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().guid({ version: 'uuidv4' }).required(),
      quantity: Joi.number().integer().min(0).max(999).required()
    })
  ).min(1).required().messages({
    'array.min': 'At least one item is required',
    'any.required': 'Items array is required'
  })
});

/**
 * @route   GET /api/cart
 * @desc    Get user's current cart with product details
 * @access  Private
 */
router.get('/', authenticateToken, getCart);

/**
 * @route   GET /api/cart/summary
 * @desc    Get cart summary with totals
 * @access  Private
 */
router.get('/summary', authenticateToken, getCartSummary);

/**
 * @route   GET /api/cart/validate
 * @desc    Validate cart items against current inventory
 * @access  Private
 */
router.get('/validate', authenticateToken, validateCart);

/**
 * @route   GET /api/cart/count
 * @desc    Get cart item count
 * @access  Private
 */
router.get('/count', authenticateToken, getCartItemCount);

/**
 * @route   GET /api/cart/recent
 * @desc    Get recently added items
 * @access  Private
 */
router.get('/recent', authenticateToken, validateQuery(recentItemsSchema), getRecentItems);

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/items', authenticateToken, validateBody(addToCartSchema), addToCart);

/**
 * @route   GET /api/cart/items/:productId
 * @desc    Check if specific product is in cart
 * @access  Private
 */
router.get('/items/:productId', authenticateToken, getCartItem);

/**
 * @route   PUT /api/cart/items/:productId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/items/:productId', authenticateToken, validateBody(updateCartItemSchema), updateCartItem);

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/items/:productId', authenticateToken, removeCartItem);

/**
 * @route   PATCH /api/cart/items
 * @desc    Update multiple cart items at once
 * @access  Private
 */
router.patch('/items', authenticateToken, validateBody(bulkUpdateSchema), updateMultipleItems);

/**
 * @route   POST /api/cart/sync
 * @desc    Sync cart with current inventory
 * @access  Private
 */
router.post('/sync', authenticateToken, syncCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', authenticateToken, clearCart);

module.exports = router;