const BaseRepository = require('./BaseRepository');

class CartRepository extends BaseRepository {
  constructor(fileManager = null) {
    super('carts.json', fileManager);
  }

  /**
   * Find cart by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User's cart or null
   */
  async findByUserId(userId) {
    return this.findOne(cart => cart.userId === userId);
  }

  /**
   * Get or create cart for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's cart
   */
  async getOrCreateCart(userId) {
    let cart = await this.findByUserId(userId);
    
    if (!cart) {
      cart = await this.create({
        userId,
        items: []
      });
    }
    
    return cart;
  }

  /**
   * Add item to cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Updated cart
   */
  async addItem(userId, productId, quantity = 1) {
    const cart = await this.getOrCreateCart(userId);
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    return this.update(cart.id, { items: cart.items });
  }

  /**
   * Update item quantity in cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object|null>} Updated cart or null
   */
  async updateItemQuantity(userId, productId, quantity) {
    const cart = await this.findByUserId(userId);
    if (!cart) {
      return null;
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return null;
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    return this.update(cart.id, { items: cart.items });
  }

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Updated cart or null
   */
  async removeItem(userId, productId) {
    const cart = await this.findByUserId(userId);
    if (!cart) {
      return null;
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return null;
    }

    cart.items.splice(itemIndex, 1);
    return this.update(cart.id, { items: cart.items });
  }

  /**
   * Clear all items from cart
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated empty cart or null
   */
  async clearCart(userId) {
    const cart = await this.findByUserId(userId);
    if (!cart) {
      return null;
    }

    return this.update(cart.id, { items: [] });
  }

  /**
   * Get cart with product details populated
   * @param {string} userId - User ID
   * @param {Function} getProductById - Function to get product by ID
   * @returns {Promise<Object|null>} Cart with product details or null
   */
  async getCartWithProducts(userId, getProductById) {
    const cart = await this.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      return cart;
    }

    // Populate product details for each cart item
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await getProductById(item.productId);
        return {
          ...item,
          product: product || null
        };
      })
    );

    // Filter out items where product no longer exists
    const validItems = itemsWithProducts.filter(item => item.product !== null);

    // Update cart if some products were removed
    if (validItems.length !== cart.items.length) {
      const updatedCart = await this.update(cart.id, { 
        items: validItems.map(({ product, ...item }) => item)
      });
      return {
        ...updatedCart,
        items: validItems
      };
    }

    return {
      ...cart,
      items: itemsWithProducts
    };
  }

  /**
   * Calculate cart totals
   * @param {Object} cartWithProducts - Cart with product details
   * @returns {Object} Cart totals
   */
  calculateTotals(cartWithProducts) {
    if (!cartWithProducts || !cartWithProducts.items) {
      return {
        itemCount: 0,
        subtotal: 0,
        total: 0
      };
    }

    const itemCount = cartWithProducts.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartWithProducts.items.reduce((sum, item) => {
      return sum + (item.product ? item.product.price * item.quantity : 0);
    }, 0);

    return {
      itemCount,
      subtotal,
      total: subtotal // Can add tax, shipping, etc. later
    };
  }

  /**
   * Get cart summary with totals
   * @param {string} userId - User ID
   * @param {Function} getProductById - Function to get product by ID
   * @returns {Promise<Object|null>} Cart summary or null
   */
  async getCartSummary(userId, getProductById) {
    const cartWithProducts = await this.getCartWithProducts(userId, getProductById);
    if (!cartWithProducts) {
      return null;
    }

    const totals = this.calculateTotals(cartWithProducts);

    return {
      ...cartWithProducts,
      ...totals
    };
  }

  /**
   * Validate cart items against inventory
   * @param {string} userId - User ID
   * @param {Function} getProductById - Function to get product by ID
   * @returns {Promise<Object>} Validation result
   */
  async validateCart(userId, getProductById) {
    const cart = await this.findByUserId(userId);
    if (!cart) {
      return { valid: true, errors: [] };
    }

    const errors = [];
    const validItems = [];

    for (const item of cart.items) {
      const product = await getProductById(item.productId);
      
      if (!product) {
        errors.push({
          productId: item.productId,
          error: 'Product no longer exists'
        });
        continue;
      }

      if (product.inventory < item.quantity) {
        errors.push({
          productId: item.productId,
          productName: product.name,
          requested: item.quantity,
          available: product.inventory,
          error: 'Insufficient inventory'
        });
      }

      validItems.push(item);
    }

    return {
      valid: errors.length === 0,
      errors,
      validItems
    };
  }

  /**
   * Get abandoned carts (not updated in X days)
   * @param {number} days - Days since last update
   * @returns {Promise<Array>} Abandoned carts
   */
  async getAbandonedCarts(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.findWhere(cart => 
      cart.items.length > 0 && 
      new Date(cart.updatedAt) < cutoffDate
    );
  }
}

module.exports = CartRepository;