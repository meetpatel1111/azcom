const Joi = require('joi');

/**
 * Cart data model interface (TypeScript-style documentation)
 * @typedef {Object} Cart
 * @property {string} id - Unique cart identifier
 * @property {string} userId - User ID who owns the cart
 * @property {Array<CartItem>} items - Array of cart items
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * CartItem data model interface
 * @typedef {Object} CartItem
 * @property {string} productId - Product ID
 * @property {number} quantity - Quantity of the product
 * @property {string} addedAt - ISO timestamp when item was added
 */

/**
 * Cart item validation schema
 */
const cartItemSchema = Joi.object({
  productId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Product ID must be a valid UUID',
      'string.empty': 'Product ID is required'
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .max(999)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 999',
      'any.required': 'Quantity is required'
    }),

  addedAt: Joi.string()
    .isoDate()
    .optional()
    .messages({
      'string.isoDate': 'Added date must be a valid ISO date'
    })
});

/**
 * Joi validation schema for adding item to cart
 */
const addToCartSchema = Joi.object({
  productId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Product ID must be a valid UUID',
      'string.empty': 'Product ID is required'
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .max(999)
    .default(1)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 999'
    })
});

/**
 * Joi validation schema for updating cart item quantity
 */
const updateCartItemSchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .min(0)
    .max(999)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity cannot be negative',
      'number.max': 'Quantity cannot exceed 999',
      'any.required': 'Quantity is required'
    })
});

/**
 * Joi validation schema for cart creation
 */
const createCartSchema = Joi.object({
  userId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'string.empty': 'User ID is required'
    }),

  items: Joi.array()
    .items(cartItemSchema)
    .default([])
    .messages({
      'array.base': 'Items must be an array'
    })
});

/**
 * Validate add to cart data
 * @param {Object} cartData - Cart data to validate
 * @returns {Object} Validation result
 */
function validateAddToCart(cartData) {
  return addToCartSchema.validate(cartData, { abortEarly: false });
}

/**
 * Validate cart item quantity update
 * @param {Object} updateData - Update data to validate
 * @returns {Object} Validation result
 */
function validateUpdateCartItem(updateData) {
  return updateCartItemSchema.validate(updateData, { abortEarly: false });
}

/**
 * Validate cart creation data
 * @param {Object} cartData - Cart data to validate
 * @returns {Object} Validation result
 */
function validateCreateCart(cartData) {
  return createCartSchema.validate(cartData, { abortEarly: false });
}

/**
 * Create a new cart object
 * @param {Object} cartData - Cart data
 * @returns {Object} Cart object
 */
function createCart(cartData) {
  return {
    userId: cartData.userId,
    items: cartData.items || []
  };
}

/**
 * Create a new cart item
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity
 * @returns {Object} Cart item object
 */
function createCartItem(productId, quantity = 1) {
  return {
    productId,
    quantity,
    addedAt: new Date().toISOString()
  };
}

/**
 * Calculate cart totals
 * @param {Object} cart - Cart with populated product data
 * @returns {Object} Cart totals
 */
function calculateCartTotals(cart) {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      itemCount: 0,
      uniqueItems: 0,
      subtotal: 0,
      total: 0
    };
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = cart.items.length;
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product ? item.product.price : 0;
    return sum + (price * item.quantity);
  }, 0);

  // For now, total equals subtotal (can add tax, shipping, discounts later)
  const total = subtotal;

  return {
    itemCount,
    uniqueItems,
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    total: Math.round(total * 100) / 100
  };
}

/**
 * Sanitize cart data for API responses
 * @param {Object} cart - Cart object
 * @returns {Object} Sanitized cart
 */
function sanitizeCart(cart) {
  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt
  };
}

/**
 * Check if cart is empty
 * @param {Object} cart - Cart object
 * @returns {boolean} True if cart is empty
 */
function isCartEmpty(cart) {
  return !cart || !cart.items || cart.items.length === 0;
}

/**
 * Find cart item by product ID
 * @param {Object} cart - Cart object
 * @param {string} productId - Product ID to find
 * @returns {Object|null} Cart item or null
 */
function findCartItem(cart, productId) {
  if (!cart || !cart.items) {
    return null;
  }
  return cart.items.find(item => item.productId === productId) || null;
}

/**
 * Get cart item count for a specific product
 * @param {Object} cart - Cart object
 * @param {string} productId - Product ID
 * @returns {number} Quantity of product in cart
 */
function getCartItemQuantity(cart, productId) {
  const item = findCartItem(cart, productId);
  return item ? item.quantity : 0;
}

module.exports = {
  cartItemSchema,
  addToCartSchema,
  updateCartItemSchema,
  createCartSchema,
  validateAddToCart,
  validateUpdateCartItem,
  validateCreateCart,
  createCart,
  createCartItem,
  calculateCartTotals,
  sanitizeCart,
  isCartEmpty,
  findCartItem,
  getCartItemQuantity
};