const Joi = require('joi');

/**
 * Order data model interface (TypeScript-style documentation)
 * @typedef {Object} Order
 * @property {string} id - Unique order identifier
 * @property {string} userId - User ID who placed the order
 * @property {Array<OrderItem>} items - Array of ordered items
 * @property {number} totalAmount - Total order amount
 * @property {string} status - Order status (pending|processing|shipped|delivered|cancelled)
 * @property {Object} shippingAddress - Shipping address
 * @property {Object} paymentInfo - Payment information
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 * @property {string} statusUpdatedAt - ISO timestamp of last status update
 */

/**
 * OrderItem data model interface
 * @typedef {Object} OrderItem
 * @property {string} productId - Product ID
 * @property {string} productName - Product name (snapshot)
 * @property {number} price - Product price at time of order
 * @property {number} quantity - Quantity ordered
 */

/**
 * Order item validation schema
 */
const orderItemSchema = Joi.object({
  productId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Product ID must be a valid UUID',
      'string.empty': 'Product ID is required'
    }),

  productName: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.max': 'Product name cannot exceed 200 characters'
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
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
    })
});

/**
 * Shipping address validation schema
 */
const shippingAddressSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name cannot exceed 50 characters'
    }),

  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name cannot exceed 50 characters'
    }),

  street: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Street address is required',
      'string.max': 'Street address cannot exceed 200 characters'
    }),

  city: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'City is required',
      'string.max': 'City cannot exceed 100 characters'
    }),

  state: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'State/Province is required',
      'string.max': 'State/Province cannot exceed 100 characters'
    }),

  zipCode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9\s-]{3,20}$/)
    .required()
    .messages({
      'string.empty': 'ZIP/Postal code is required',
      'string.pattern.base': 'ZIP/Postal code format is invalid'
    })
});

/**
 * Payment info validation schema
 */
const paymentInfoSchema = Joi.object({
  method: Joi.string()
    .valid('credit_card', 'debit_card', 'paypal', 'bank_transfer')
    .required()
    .messages({
      'any.only': 'Payment method must be one of: credit_card, debit_card, paypal, bank_transfer',
      'string.empty': 'Payment method is required'
    }),

  // For demo purposes - in production, never store actual card details
  cardLast4: Joi.string()
    .pattern(/^\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Card last 4 digits must be 4 numbers'
    }),

  cardBrand: Joi.string()
    .valid('visa', 'mastercard', 'amex', 'discover')
    .optional()
    .messages({
      'any.only': 'Card brand must be one of: visa, mastercard, amex, discover'
    }),

  transactionId: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.max': 'Transaction ID cannot exceed 100 characters'
    })
});

/**
 * Joi validation schema for order creation
 */
const createOrderSchema = Joi.object({
  userId: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'string.empty': 'User ID is required'
    }),

  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .required()
    .messages({
      'array.base': 'Items must be an array',
      'array.min': 'Order must contain at least one item',
      'any.required': 'Items are required'
    }),

  totalAmount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Total amount must be a number',
      'number.positive': 'Total amount must be positive',
      'any.required': 'Total amount is required'
    }),

  shippingAddress: shippingAddressSchema.required(),

  paymentInfo: paymentInfoSchema.required(),

  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .default('pending')
    .messages({
      'any.only': 'Status must be one of: pending, processing, shipped, delivered, cancelled'
    })
});

/**
 * Joi validation schema for order status update
 */
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, processing, shipped, delivered, cancelled',
      'string.empty': 'Status is required'
    })
});

/**
 * Validate order creation data
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result
 */
function validateCreateOrder(orderData) {
  return createOrderSchema.validate(orderData, { abortEarly: false });
}

/**
 * Validate order status update
 * @param {Object} statusData - Status update data to validate
 * @returns {Object} Validation result
 */
function validateUpdateOrderStatus(statusData) {
  return updateOrderStatusSchema.validate(statusData, { abortEarly: false });
}

/**
 * Create a new order object
 * @param {Object} orderData - Order data
 * @returns {Object} Order object
 */
function createOrder(orderData) {
  return {
    userId: orderData.userId,
    items: orderData.items,
    totalAmount: orderData.totalAmount,
    status: orderData.status || 'pending',
    shippingAddress: orderData.shippingAddress,
    paymentInfo: orderData.paymentInfo,
    statusUpdatedAt: new Date().toISOString()
  };
}

/**
 * Create order item from cart item and product
 * @param {Object} cartItem - Cart item
 * @param {Object} product - Product details
 * @returns {Object} Order item
 */
function createOrderItem(cartItem, product) {
  return {
    productId: cartItem.productId,
    productName: product.name,
    price: product.price,
    quantity: cartItem.quantity
  };
}

/**
 * Calculate order totals from items
 * @param {Array} items - Order items
 * @returns {Object} Order totals
 */
function calculateOrderTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = 0; // Can implement tax calculation later
  const shipping = 0; // Can implement shipping calculation later
  const total = subtotal + tax + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/**
 * Sanitize order data for API responses
 * @param {Object} order - Order object
 * @returns {Object} Sanitized order
 */
function sanitizeOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
    status: order.status,
    shippingAddress: order.shippingAddress,
    paymentInfo: {
      method: order.paymentInfo.method,
      cardLast4: order.paymentInfo.cardLast4,
      cardBrand: order.paymentInfo.cardBrand
      // Exclude sensitive payment details
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    statusUpdatedAt: order.statusUpdatedAt
  };
}

/**
 * Check if order can be cancelled
 * @param {Object} order - Order object
 * @returns {boolean} True if order can be cancelled
 */
function canCancelOrder(order) {
  return order.status === 'pending' || order.status === 'processing';
}

/**
 * Check if order is completed
 * @param {Object} order - Order object
 * @returns {boolean} True if order is completed
 */
function isOrderCompleted(order) {
  return order.status === 'delivered';
}

/**
 * Get order status display name
 * @param {string} status - Order status
 * @returns {string} Display name
 */
function getOrderStatusDisplay(status) {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
}

module.exports = {
  orderItemSchema,
  shippingAddressSchema,
  paymentInfoSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  validateCreateOrder,
  validateUpdateOrderStatus,
  createOrder,
  createOrderItem,
  calculateOrderTotals,
  sanitizeOrder,
  canCancelOrder,
  isOrderCompleted,
  getOrderStatusDisplay
};