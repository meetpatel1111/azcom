const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../middleware/errorHandler');
const { 
  validateAddToCart,
  validateUpdateCartItem,
  calculateCartTotals,
  sanitizeCart 
} = require('../models/Cart');

const cartRepository = new CartRepository();
const productRepository = new ProductRepository();

/**
 * Get user's current cart
 * GET /api/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get cart with product details
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId, 
    (productId) => productRepository.findById(productId)
  );

  if (!cartWithProducts) {
    // Create empty cart if none exists
    const newCart = await cartRepository.getOrCreateCart(userId);
    return res.json({
      cart: sanitizeCart(newCart),
      itemCount: 0,
      uniqueItems: 0,
      subtotal: 0,
      total: 0
    });
  }

  // Calculate totals
  const totals = calculateCartTotals(cartWithProducts);

  res.json({
    cart: sanitizeCart(cartWithProducts),
    ...totals
  });
});

/**
 * Add item to cart
 * POST /api/cart/items
 */
const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Validate request data
  const { error, value } = validateAddToCart(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Cart validation failed', details);
  }

  const { productId, quantity } = value;

  // Check if product exists and has sufficient inventory
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check inventory availability
  const hasInventory = await productRepository.hasInventory(productId, quantity);
  if (!hasInventory) {
    throw new ConflictError(`Insufficient inventory. Only ${product.inventory} items available.`);
  }

  // Add item to cart
  const updatedCart = await cartRepository.addItem(userId, productId, quantity);

  // Get cart with product details for response
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (id) => productRepository.findById(id)
  );

  const totals = calculateCartTotals(cartWithProducts);

  res.status(201).json({
    message: 'Item added to cart successfully',
    cart: sanitizeCart(cartWithProducts),
    addedItem: {
      productId,
      productName: product.name,
      quantity,
      price: product.price
    },
    ...totals
  });
});

/**
 * Get cart summary with totals
 * GET /api/cart/summary
 */
const getCartSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cartSummary = await cartRepository.getCartSummary(
    userId,
    (productId) => productRepository.findById(productId)
  );

  if (!cartSummary) {
    return res.json({
      itemCount: 0,
      uniqueItems: 0,
      subtotal: 0,
      total: 0,
      isEmpty: true
    });
  }

  res.json({
    ...cartSummary,
    isEmpty: cartSummary.itemCount === 0
  });
});

/**
 * Validate cart items against current inventory
 * GET /api/cart/validate
 */
const validateCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const validation = await cartRepository.validateCart(
    userId,
    (productId) => productRepository.findById(productId)
  );

  res.json({
    valid: validation.valid,
    errors: validation.errors,
    validItems: validation.validItems,
    summary: {
      totalItems: validation.validItems.length + validation.errors.length,
      validItems: validation.validItems.length,
      invalidItems: validation.errors.length
    }
  });
});

/**
 * Get cart item count
 * GET /api/cart/count
 */
const getCartItemCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await cartRepository.findByUserId(userId);
  
  if (!cart || !cart.items) {
    return res.json({ count: 0 });
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({ 
    count: itemCount,
    uniqueItems: cart.items.length
  });
});

/**
 * Check if specific product is in cart
 * GET /api/cart/items/:productId
 */
const getCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  // Validate product exists
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const cart = await cartRepository.findByUserId(userId);
  
  if (!cart) {
    return res.json({
      inCart: false,
      quantity: 0,
      product: {
        id: product.id,
        name: product.name,
        price: product.price
      }
    });
  }

  const cartItem = cart.items.find(item => item.productId === productId);
  
  res.json({
    inCart: !!cartItem,
    quantity: cartItem ? cartItem.quantity : 0,
    addedAt: cartItem ? cartItem.addedAt : null,
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
      inventory: product.inventory
    }
  });
});

/**
 * Get recently added items
 * GET /api/cart/recent
 */
const getRecentItems = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 5 } = req.query;

  const cart = await cartRepository.findByUserId(userId);
  
  if (!cart || !cart.items || cart.items.length === 0) {
    return res.json({ items: [] });
  }

  // Sort by addedAt date (most recent first) and limit
  const recentItems = cart.items
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, parseInt(limit));

  // Get product details for recent items
  const itemsWithProducts = await Promise.all(
    recentItems.map(async (item) => {
      const product = await productRepository.findById(item.productId);
      return {
        ...item,
        product: product ? {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        } : null
      };
    })
  );

  // Filter out items where product no longer exists
  const validItems = itemsWithProducts.filter(item => item.product !== null);

  res.json({
    items: validItems,
    count: validItems.length
  });
});

/**
 * Update cart item quantity
 * PUT /api/cart/items/:productId
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  // Validate request data
  const { error, value } = validateUpdateCartItem(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Cart item validation failed', details);
  }

  const { quantity } = value;

  // Check if product exists
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // If quantity is 0, remove the item
  if (quantity === 0) {
    const updatedCart = await cartRepository.removeItem(userId, productId);
    if (!updatedCart) {
      throw new NotFoundError('Cart item not found');
    }

    // Get cart with product details for response
    const cartWithProducts = await cartRepository.getCartWithProducts(
      userId,
      (id) => productRepository.findById(id)
    );

    const totals = calculateCartTotals(cartWithProducts);

    return res.json({
      message: 'Item removed from cart successfully',
      cart: sanitizeCart(cartWithProducts),
      removedItem: {
        productId,
        productName: product.name
      },
      ...totals
    });
  }

  // Check inventory availability for the new quantity
  const hasInventory = await productRepository.hasInventory(productId, quantity);
  if (!hasInventory) {
    throw new ConflictError(`Insufficient inventory. Only ${product.inventory} items available.`);
  }

  // Update item quantity
  const updatedCart = await cartRepository.updateItemQuantity(userId, productId, quantity);
  if (!updatedCart) {
    throw new NotFoundError('Cart item not found');
  }

  // Get cart with product details for response
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (id) => productRepository.findById(id)
  );

  const totals = calculateCartTotals(cartWithProducts);

  res.json({
    message: 'Cart item updated successfully',
    cart: sanitizeCart(cartWithProducts),
    updatedItem: {
      productId,
      productName: product.name,
      quantity,
      price: product.price
    },
    ...totals
  });
});

/**
 * Remove item from cart
 * DELETE /api/cart/items/:productId
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  // Check if product exists (for response data)
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Remove item from cart
  const updatedCart = await cartRepository.removeItem(userId, productId);
  if (!updatedCart) {
    throw new NotFoundError('Cart item not found');
  }

  // Get cart with product details for response
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (id) => productRepository.findById(id)
  );

  const totals = calculateCartTotals(cartWithProducts);

  res.json({
    message: 'Item removed from cart successfully',
    cart: sanitizeCart(cartWithProducts),
    removedItem: {
      productId,
      productName: product.name
    },
    ...totals
  });
});

/**
 * Update multiple cart items at once
 * PATCH /api/cart/items
 */
const updateMultipleItems = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { items } = req.body;

  // Validate input
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Items array is required and must not be empty');
  }

  const results = {
    successful: [],
    failed: []
  };

  // Process each item update
  for (const item of items) {
    try {
      const { error, value } = validateUpdateCartItem({ quantity: item.quantity });
      if (error) {
        results.failed.push({
          productId: item.productId,
          error: 'Invalid quantity'
        });
        continue;
      }

      const { productId, quantity } = item;

      // Check if product exists
      const product = await productRepository.findById(productId);
      if (!product) {
        results.failed.push({
          productId,
          error: 'Product not found'
        });
        continue;
      }

      // Handle removal (quantity 0)
      if (quantity === 0) {
        const updatedCart = await cartRepository.removeItem(userId, productId);
        if (updatedCart) {
          results.successful.push({
            productId,
            action: 'removed',
            productName: product.name
          });
        } else {
          results.failed.push({
            productId,
            error: 'Item not in cart'
          });
        }
        continue;
      }

      // Check inventory
      const hasInventory = await productRepository.hasInventory(productId, quantity);
      if (!hasInventory) {
        results.failed.push({
          productId,
          error: `Insufficient inventory. Only ${product.inventory} available.`
        });
        continue;
      }

      // Update quantity
      const updatedCart = await cartRepository.updateItemQuantity(userId, productId, quantity);
      if (updatedCart) {
        results.successful.push({
          productId,
          action: 'updated',
          quantity,
          productName: product.name
        });
      } else {
        results.failed.push({
          productId,
          error: 'Item not in cart'
        });
      }

    } catch (error) {
      results.failed.push({
        productId: item.productId,
        error: error.message
      });
    }
  }

  // Get updated cart with product details
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (id) => productRepository.findById(id)
  );

  const totals = calculateCartTotals(cartWithProducts);

  res.json({
    message: 'Bulk cart update completed',
    cart: sanitizeCart(cartWithProducts),
    results,
    summary: {
      total: items.length,
      successful: results.successful.length,
      failed: results.failed.length
    },
    ...totals
  });
});

/**
 * Clear entire cart
 * DELETE /api/cart
 */
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const clearedCart = await cartRepository.clearCart(userId);
  
  if (!clearedCart) {
    throw new NotFoundError('Cart not found');
  }

  res.json({
    message: 'Cart cleared successfully',
    cart: sanitizeCart(clearedCart)
  });
});

/**
 * Sync cart with inventory (remove out-of-stock items)
 * POST /api/cart/sync
 */
const syncCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Validate cart against current inventory
  const validation = await cartRepository.validateCart(
    userId,
    (productId) => productRepository.findById(productId)
  );

  const removedItems = [];
  const updatedItems = [];

  // Remove items that are no longer available or have insufficient inventory
  for (const error of validation.errors) {
    if (error.error === 'Product no longer exists') {
      await cartRepository.removeItem(userId, error.productId);
      removedItems.push({
        productId: error.productId,
        reason: 'Product no longer available'
      });
    } else if (error.error === 'Insufficient inventory') {
      // Update to maximum available quantity
      if (error.available > 0) {
        await cartRepository.updateItemQuantity(userId, error.productId, error.available);
        updatedItems.push({
          productId: error.productId,
          productName: error.productName,
          previousQuantity: error.requested,
          newQuantity: error.available,
          reason: 'Adjusted to available inventory'
        });
      } else {
        await cartRepository.removeItem(userId, error.productId);
        removedItems.push({
          productId: error.productId,
          productName: error.productName,
          reason: 'Out of stock'
        });
      }
    }
  }

  // Get updated cart
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (id) => productRepository.findById(id)
  );

  const totals = calculateCartTotals(cartWithProducts);

  res.json({
    message: 'Cart synchronized with inventory',
    cart: sanitizeCart(cartWithProducts),
    changes: {
      removedItems,
      updatedItems
    },
    summary: {
      itemsRemoved: removedItems.length,
      itemsUpdated: updatedItems.length,
      totalChanges: removedItems.length + updatedItems.length
    },
    ...totals
  });
});

module.exports = {
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
};