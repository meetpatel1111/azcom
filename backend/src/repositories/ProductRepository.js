const BaseRepository = require('./BaseRepository');

class ProductRepository extends BaseRepository {
  constructor(fileManager = null) {
    super('products.json', fileManager);
  }

  /**
   * Find products by category
   * @param {string} category - Product category
   * @returns {Promise<Array>} Products in category
   */
  async findByCategory(category) {
    return this.findWhere(product => 
      product.category && product.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Search products by name or description
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching products
   */
  async search(query) {
    const searchTerm = query.toLowerCase();
    return this.findWhere(product => 
      (product.name && product.name.toLowerCase().includes(searchTerm)) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Find products with filters and sorting
   * @param {Object} options - Filter and sort options
   * @returns {Promise<Array>} Filtered and sorted products
   */
  async findWithFilters(options = {}) {
    let products = await this.findAll();

    // Apply category filter
    if (options.category) {
      products = products.filter(product => 
        product.category && product.category.toLowerCase() === options.category.toLowerCase()
      );
    }

    // Apply search filter
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      products = products.filter(product => 
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply price range filter
    if (options.minPrice !== undefined) {
      products = products.filter(product => product.price >= options.minPrice);
    }
    if (options.maxPrice !== undefined) {
      products = products.filter(product => product.price <= options.maxPrice);
    }

    // Apply availability filter
    if (options.inStock === true) {
      products = products.filter(product => product.inventory > 0);
    }

    // Apply sorting
    if (options.sortBy) {
      products.sort((a, b) => {
        const aValue = a[options.sortBy];
        const bValue = b[options.sortBy];
        
        if (options.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      products = products.slice(offset, offset + options.limit);
    }

    return products;
  }

  /**
   * Update product inventory
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add/subtract (negative to subtract)
   * @returns {Promise<Object|null>} Updated product or null
   */
  async updateInventory(productId, quantity) {
    const product = await this.findById(productId);
    if (!product) {
      return null;
    }

    const newInventory = product.inventory + quantity;
    if (newInventory < 0) {
      throw new Error('Insufficient inventory');
    }

    return this.update(productId, { inventory: newInventory });
  }

  /**
   * Check if product has sufficient inventory
   * @param {string} productId - Product ID
   * @param {number} requiredQuantity - Required quantity
   * @returns {Promise<boolean>} True if sufficient inventory
   */
  async hasInventory(productId, requiredQuantity) {
    const product = await this.findById(productId);
    return product && product.inventory >= requiredQuantity;
  }

  /**
   * Get products with low inventory
   * @param {number} threshold - Low inventory threshold (default: 10)
   * @returns {Promise<Array>} Products with low inventory
   */
  async findLowInventory(threshold = 10) {
    return this.findWhere(product => product.inventory <= threshold);
  }

  /**
   * Get all unique categories
   * @returns {Promise<Array>} Array of unique categories
   */
  async getCategories() {
    const products = await this.findAll();
    const categories = products
      .map(product => product.category)
      .filter(category => category) // Remove null/undefined
      .filter((category, index, arr) => arr.indexOf(category) === index); // Remove duplicates
    
    return categories.sort();
  }

  /**
   * Get product statistics
   * @returns {Promise<Object>} Product statistics
   */
  async getProductStats() {
    const products = await this.findAll();
    const categories = await this.getCategories();
    
    const stats = {
      totalProducts: products.length,
      totalCategories: categories.length,
      averagePrice: 0,
      totalInventory: 0,
      outOfStock: 0,
      lowInventory: 0
    };

    if (products.length > 0) {
      stats.averagePrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
      stats.totalInventory = products.reduce((sum, p) => sum + p.inventory, 0);
      stats.outOfStock = products.filter(p => p.inventory === 0).length;
      stats.lowInventory = products.filter(p => p.inventory > 0 && p.inventory <= 10).length;
    }

    return stats;
  }
}

module.exports = ProductRepository;