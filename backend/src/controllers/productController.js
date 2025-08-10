const ProductRepository = require('../repositories/ProductRepository');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { 
  validateCreateProduct, 
  validateUpdateProduct,
  createProduct, 
  sanitizeProduct 
} = require('../models/Product');

const productRepository = new ProductRepository();

/**
 * Get all products with filtering and search
 * GET /api/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 12
  } = req.query;

  // Build filter options
  const filterOptions = {
    search: search ? search.trim() : undefined,
    category: category ? category.trim() : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    inStock: inStock === 'true',
    sortBy,
    sortOrder,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  // Get filtered products
  const products = await productRepository.findWithFilters(filterOptions);
  
  // Get total count for pagination (without limit/offset)
  const totalFilterOptions = { ...filterOptions };
  delete totalFilterOptions.limit;
  delete totalFilterOptions.offset;
  const allFilteredProducts = await productRepository.findWithFilters(totalFilterOptions);
  const total = allFilteredProducts.length;

  // Sanitize products
  const sanitizedProducts = products.map(product => sanitizeProduct(product));

  res.json({
    products: sanitizedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: (parseInt(page) * parseInt(limit)) < total,
      hasPrev: parseInt(page) > 1
    },
    filters: {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder
    }
  });
});

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await productRepository.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.json({
    product: sanitizeProduct(product)
  });
});

/**
 * Get products by category
 * GET /api/products/category/:category
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const filterOptions = {
    category: category.trim(),
    sortBy,
    sortOrder,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const products = await productRepository.findWithFilters(filterOptions);
  
  // Get total count for this category
  const allCategoryProducts = await productRepository.findByCategory(category);
  const total = allCategoryProducts.length;

  const sanitizedProducts = products.map(product => sanitizeProduct(product));

  res.json({
    products: sanitizedProducts,
    category,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: (parseInt(page) * parseInt(limit)) < total,
      hasPrev: parseInt(page) > 1
    }
  });
});

/**
 * Search products
 * GET /api/products/search/:query
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { query } = req.params;
  const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  if (!query || query.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters long');
  }

  const filterOptions = {
    search: query.trim(),
    sortBy,
    sortOrder,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const products = await productRepository.findWithFilters(filterOptions);
  
  // Get total count for this search
  const allSearchResults = await productRepository.search(query);
  const total = allSearchResults.length;

  const sanitizedProducts = products.map(product => sanitizeProduct(product));

  res.json({
    products: sanitizedProducts,
    query,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: (parseInt(page) * parseInt(limit)) < total,
      hasPrev: parseInt(page) > 1
    }
  });
});

/**
 * Get all product categories
 * GET /api/products/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await productRepository.getCategories();
  
  res.json({
    categories
  });
});

/**
 * Get product statistics
 * GET /api/products/stats
 */
const getProductStats = asyncHandler(async (req, res) => {
  const stats = await productRepository.getProductStats();
  
  res.json({
    stats
  });
});

/**
 * Get products with low inventory
 * GET /api/products/low-inventory
 */
const getLowInventoryProducts = asyncHandler(async (req, res) => {
  const { threshold = 10 } = req.query;
  
  const products = await productRepository.findLowInventory(parseInt(threshold));
  const sanitizedProducts = products.map(product => sanitizeProduct(product));
  
  res.json({
    products: sanitizedProducts,
    threshold: parseInt(threshold),
    count: products.length
  });
});

/**
 * Check product availability
 * GET /api/products/:id/availability
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity = 1 } = req.query;
  
  const product = await productRepository.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const requestedQuantity = parseInt(quantity);
  const available = await productRepository.hasInventory(id, requestedQuantity);
  
  res.json({
    productId: id,
    productName: product.name,
    requestedQuantity,
    availableQuantity: product.inventory,
    available,
    inStock: product.inventory > 0
  });
});

/**
 * Get featured products (placeholder - could be based on sales, ratings, etc.)
 * GET /api/products/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  
  // For now, just return recent products
  // In a real app, this could be based on sales, ratings, manual curation, etc.
  const filterOptions = {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: parseInt(limit),
    inStock: true
  };

  const products = await productRepository.findWithFilters(filterOptions);
  const sanitizedProducts = products.map(product => sanitizeProduct(product));
  
  res.json({
    products: sanitizedProducts,
    count: products.length
  });
});

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getCategories,
  getProductStats,
  getLowInventoryProducts,
  checkAvailability,
  getFeaturedProducts
};