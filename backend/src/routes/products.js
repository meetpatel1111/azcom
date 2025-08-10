const express = require('express');
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateQuery, validateBody } = require('../middleware/validation');
const Joi = require('joi');
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getCategories,
  getProductStats,
  getLowInventoryProducts,
  checkAvailability,
  getFeaturedProducts
} = require('../controllers/productController');
const {
  createNewProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  bulkUpdateProducts,
  bulkDeleteProducts,
  importProducts
} = require('../controllers/adminProductController');
const { 
  createProductSchema, 
  updateProductSchema 
} = require('../models/Product');

const router = express.Router();

/**
 * Product Routes
 * All routes are prefixed with /api/products
 */

// Validation schemas for query parameters
const productListSchema = Joi.object({
  search: Joi.string().min(2).max(100).optional(),
  category: Joi.string().min(1).max(100).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional(),
  sortBy: Joi.string().valid('name', 'price', 'createdAt', 'updatedAt', 'inventory').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12)
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
  sortBy: Joi.string().valid('name', 'price', 'createdAt', 'updatedAt', 'inventory').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const availabilitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).default(1)
});

const lowInventorySchema = Joi.object({
  threshold: Joi.number().integer().min(1).max(1000).default(10)
});

const featuredSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(8)
});

const productIdSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'Product ID must be a valid UUID'
  })
});

const categorySchema = Joi.object({
  category: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Category is required'
  })
});

const searchQuerySchema = Joi.object({
  query: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Search query must be at least 2 characters long',
    'string.empty': 'Search query is required'
  })
});

/**
 * Public Product Routes (no authentication required)
 */

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, search, and pagination
 * @access  Public
 */
router.get('/', optionalAuth, validateQuery(productListSchema), getProducts);

/**
 * @route   GET /api/products/categories
 * @desc    Get all product categories
 * @access  Public
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', validateQuery(featuredSchema), getFeaturedProducts);

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Public
 */
router.get('/stats', getProductStats);

/**
 * @route   GET /api/products/low-inventory
 * @desc    Get products with low inventory
 * @access  Public
 */
router.get('/low-inventory', validateQuery(lowInventorySchema), getLowInventoryProducts);

/**
 * @route   GET /api/products/search/:query
 * @desc    Search products by query
 * @access  Public
 */
router.get('/search/:query', validateQuery(paginationSchema), searchProducts);

/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:category', validateQuery(paginationSchema), getProductsByCategory);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

/**
 * @route   GET /api/products/:id/availability
 * @desc    Check product availability
 * @access  Public
 */
router.get('/:id/availability', validateQuery(availabilitySchema), checkAvailability);

/**
 * Admin Product Management Routes (require admin role)
 */

// Validation schemas for admin operations
const inventoryUpdateSchema = Joi.object({
  quantity: Joi.number().integer().required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'any.required': 'Quantity is required'
  }),
  operation: Joi.string().valid('set', 'add', 'subtract').default('set').messages({
    'any.only': 'Operation must be one of: set, add, subtract'
  })
});

const bulkUpdateSchema = Joi.object({
  productIds: Joi.array().items(
    Joi.string().guid({ version: 'uuidv4' })
  ).min(1).required().messages({
    'array.min': 'At least one product ID is required',
    'any.required': 'Product IDs are required'
  }),
  updates: updateProductSchema.required().messages({
    'any.required': 'Updates object is required'
  })
});

const bulkDeleteSchema = Joi.object({
  productIds: Joi.array().items(
    Joi.string().guid({ version: 'uuidv4' })
  ).min(1).required().messages({
    'array.min': 'At least one product ID is required',
    'any.required': 'Product IDs are required'
  })
});

const importProductsSchema = Joi.object({
  products: Joi.array().items(createProductSchema).min(1).required().messages({
    'array.min': 'At least one product is required',
    'any.required': 'Products array is required'
  }),
  skipDuplicates: Joi.boolean().default(true)
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, validateBody(createProductSchema), createNewProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product by ID
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, validateBody(updateProductSchema), updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product by ID
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

/**
 * @route   PATCH /api/products/:id/inventory
 * @desc    Update product inventory
 * @access  Private (Admin only)
 */
router.patch('/:id/inventory', authenticateToken, requireAdmin, validateBody(inventoryUpdateSchema), updateInventory);

/**
 * @route   PATCH /api/products/bulk
 * @desc    Bulk update products
 * @access  Private (Admin only)
 */
router.patch('/bulk', authenticateToken, requireAdmin, validateBody(bulkUpdateSchema), bulkUpdateProducts);

/**
 * @route   DELETE /api/products/bulk
 * @desc    Bulk delete products
 * @access  Private (Admin only)
 */
router.delete('/bulk', authenticateToken, requireAdmin, validateBody(bulkDeleteSchema), bulkDeleteProducts);

/**
 * @route   POST /api/products/import
 * @desc    Import products from array
 * @access  Private (Admin only)
 */
router.post('/import', authenticateToken, requireAdmin, validateBody(importProductsSchema), importProducts);

module.exports = router;