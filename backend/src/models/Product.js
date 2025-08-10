const Joi = require('joi');

/**
 * Product data model interface (TypeScript-style documentation)
 * @typedef {Object} Product
 * @property {string} id - Unique product identifier
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {number} price - Product price in cents/smallest currency unit
 * @property {string} category - Product category
 * @property {string} imageUrl - URL to product image
 * @property {number} inventory - Available inventory count
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * Joi validation schema for Product creation
 */
const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name cannot exceed 200 characters'
    }),

  description: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Product description is required',
      'string.min': 'Product description must be at least 1 character',
      'string.max': 'Product description cannot exceed 2000 characters'
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

  category: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Category is required',
      'string.max': 'Category cannot exceed 100 characters'
    }),

  imageUrl: Joi.string()
    .uri()
    .allow('')
    .optional()
    .messages({
      'string.uri': 'Image URL must be a valid URL'
    }),

  inventory: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Inventory must be a number',
      'number.integer': 'Inventory must be a whole number',
      'number.min': 'Inventory cannot be negative',
      'any.required': 'Inventory is required'
    })
});

/**
 * Joi validation schema for Product updates
 */
const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name cannot exceed 200 characters'
    }),

  description: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .optional()
    .messages({
      'string.empty': 'Product description cannot be empty',
      'string.min': 'Product description must be at least 1 character',
      'string.max': 'Product description cannot exceed 2000 characters'
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive'
    }),

  category: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Category cannot be empty',
      'string.max': 'Category cannot exceed 100 characters'
    }),

  imageUrl: Joi.string()
    .uri()
    .allow('')
    .optional()
    .messages({
      'string.uri': 'Image URL must be a valid URL'
    }),

  inventory: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Inventory must be a number',
      'number.integer': 'Inventory must be a whole number',
      'number.min': 'Inventory cannot be negative'
    })
});

/**
 * Validate product data for creation
 * @param {Object} productData - Product data to validate
 * @returns {Object} Validation result
 */
function validateCreateProduct(productData) {
  return createProductSchema.validate(productData, { abortEarly: false });
}

/**
 * Validate product data for updates
 * @param {Object} productData - Product data to validate
 * @returns {Object} Validation result
 */
function validateUpdateProduct(productData) {
  return updateProductSchema.validate(productData, { abortEarly: false });
}

/**
 * Create a new product object with defaults
 * @param {Object} productData - Product data
 * @returns {Object} Product object
 */
function createProduct(productData) {
  return {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    category: productData.category,
    imageUrl: productData.imageUrl || '',
    inventory: productData.inventory
  };
}

/**
 * Sanitize product data for API responses
 * @param {Object} product - Product object
 * @returns {Object} Sanitized product
 */
function sanitizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    imageUrl: product.imageUrl,
    inventory: product.inventory,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

module.exports = {
  createProductSchema,
  updateProductSchema,
  validateCreateProduct,
  validateUpdateProduct,
  createProduct,
  sanitizeProduct
};