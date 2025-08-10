const OrderRepository = require('../repositories/OrderRepository');
const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../middleware/errorHandler');
const { 
  validateCreateOrder,
  validateUpdateOrderStatus,
  createOrder,
  createOrderItem,
  calculateOrderTotals,
  sanitizeOrder,
  canCancelOrder
} = require('../models/Order');

const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const productRepository = new ProductRepository();

/**
 * Create order from cart contents
 * POST /api/orders
 */
const createOrderFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Validate request data
  const { error, value } = validateCreateOrder(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Order validation failed', details);
  }

  const { shippingAddress, paymentInfo } = value;

  // Get user's cart with product details
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (productId) => productRepository.findById(productId)
  );

  if (!cartWithProducts || !cartWithProducts.items || cartWithProducts.items.length === 0) {
    throw new ValidationError('Cart is empty. Cannot create order.');
  }

  // Validate cart items against current inventory
  const validation = await cartRepository.validateCart(
    userId,
    (productId) => productRepository.findById(productId)
  );

  if (!validation.valid) {
    throw new ConflictError('Cart contains invalid items. Please review your cart.', validation.errors);
  }

  // Create order items from cart items
  const orderItems = [];
  let totalAmount = 0;

  for (const cartItem of cartWithProducts.items) {
    if (!cartItem.product) {
      throw new ConflictError(`Product ${cartItem.productId} is no longer available`);
    }

    // Double-check inventory before creating order
    const hasInventory = await productRepository.hasInventory(cartItem.productId, cartItem.quantity);
    if (!hasInventory) {
      throw new ConflictError(`Insufficient inventory for ${cartItem.product.name}. Only ${cartItem.product.inventory} available.`);
    }

    const orderItem = createOrderItem(cartItem, cartItem.product);
    orderItems.push(orderItem);
    totalAmount += orderItem.price * orderItem.quantity;
  }

  // Create order
  const orderData = createOrder({
    userId,
    items: orderItems,
    totalAmount,
    shippingAddress,
    paymentInfo,
    status: 'pending'
  });

  const order = await orderRepository.createOrder(orderData);

  // Update product inventory
  const inventoryUpdates = [];
  for (const orderItem of orderItems) {
    try {
      const updatedProduct = await productRepository.updateInventory(orderItem.productId, -orderItem.quantity);
      inventoryUpdates.push({
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantityReduced: orderItem.quantity,
        newInventory: updatedProduct.inventory
      });
    } catch (error) {
      // If inventory update fails, we should ideally rollback the order
      // For now, we'll log the error and continue
      console.error(`Failed to update inventory for product ${orderItem.productId}:`, error);
    }
  }

  // Clear the cart after successful order creation
  await cartRepository.clearCart(userId);

  res.status(201).json({
    message: 'Order created successfully',
    order: sanitizeOrder(order),
    inventoryUpdates,
    summary: {
      itemCount: orderItems.length,
      totalAmount: order.totalAmount,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    }
  });
});

/**
 * Update order status
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Validate request data
  const { error, value } = validateUpdateOrderStatus(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Status validation failed', details);
  }

  const { status } = value;

  // Get existing order
  const existingOrder = await orderRepository.findById(id);
  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order (customers can only update their own orders)
  if (req.user.role !== 'admin' && existingOrder.userId !== userId) {
    throw new NotFoundError('Order not found');
  }

  // Only allow certain status transitions for customers
  if (req.user.role !== 'admin') {
    // Customers can only cancel pending or processing orders
    if (status === 'cancelled' && !canCancelOrder(existingOrder)) {
      throw new ValidationError('Order cannot be cancelled at this stage');
    }
    
    // Customers can only cancel orders, not change to other statuses
    if (status !== 'cancelled') {
      throw new ValidationError('You can only cancel orders');
    }
  }

  // Update order status
  const updatedOrder = await orderRepository.updateStatus(id, status);
  if (!updatedOrder) {
    throw new NotFoundError('Order not found');
  }

  // If order is cancelled, restore inventory
  if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
    const inventoryRestorations = [];
    for (const orderItem of existingOrder.items) {
      try {
        const updatedProduct = await productRepository.updateInventory(orderItem.productId, orderItem.quantity);
        inventoryRestorations.push({
          productId: orderItem.productId,
          productName: orderItem.productName,
          quantityRestored: orderItem.quantity,
          newInventory: updatedProduct.inventory
        });
      } catch (error) {
        console.error(`Failed to restore inventory for product ${orderItem.productId}:`, error);
      }
    }

    return res.json({
      message: 'Order cancelled successfully',
      order: sanitizeOrder(updatedOrder),
      inventoryRestorations
    });
  }

  res.json({
    message: 'Order status updated successfully',
    order: sanitizeOrder(updatedOrder),
    previousStatus: existingOrder.status,
    newStatus: status
  });
});

/**
 * Cancel order
 * POST /api/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get existing order
  const existingOrder = await orderRepository.findById(id);
  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order
  if (req.user.role !== 'admin' && existingOrder.userId !== userId) {
    throw new NotFoundError('Order not found');
  }

  // Check if order can be cancelled
  if (!canCancelOrder(existingOrder)) {
    throw new ValidationError('Order cannot be cancelled at this stage');
  }

  // Cancel the order
  const cancelledOrder = await orderRepository.cancelOrder(id);
  if (!cancelledOrder) {
    throw new NotFoundError('Order not found');
  }

  // Restore inventory
  const inventoryRestorations = [];
  for (const orderItem of existingOrder.items) {
    try {
      const updatedProduct = await productRepository.updateInventory(orderItem.productId, orderItem.quantity);
      inventoryRestorations.push({
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantityRestored: orderItem.quantity,
        newInventory: updatedProduct.inventory
      });
    } catch (error) {
      console.error(`Failed to restore inventory for product ${orderItem.productId}:`, error);
    }
  }

  res.json({
    message: 'Order cancelled successfully',
    order: sanitizeOrder(cancelledOrder),
    inventoryRestorations,
    refundInfo: {
      amount: existingOrder.totalAmount,
      method: existingOrder.paymentInfo.method,
      estimatedRefundTime: '3-5 business days'
    }
  });
});

/**
 * Validate order before creation (dry run)
 * POST /api/orders/validate
 */
const validateOrderCreation = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Validate request data
  const { error, value } = validateCreateOrder(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return res.status(400).json({
      valid: false,
      errors: details,
      message: 'Order validation failed'
    });
  }

  // Get user's cart with product details
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (productId) => productRepository.findById(productId)
  );

  if (!cartWithProducts || !cartWithProducts.items || cartWithProducts.items.length === 0) {
    return res.json({
      valid: false,
      errors: [{ message: 'Cart is empty' }],
      message: 'Cannot create order from empty cart'
    });
  }

  // Validate cart items against current inventory
  const validation = await cartRepository.validateCart(
    userId,
    (productId) => productRepository.findById(productId)
  );

  if (!validation.valid) {
    return res.json({
      valid: false,
      errors: validation.errors,
      message: 'Cart contains invalid items'
    });
  }

  // Calculate order totals
  const orderItems = cartWithProducts.items.map(cartItem => 
    createOrderItem(cartItem, cartItem.product)
  );
  const totals = calculateOrderTotals(orderItems);

  res.json({
    valid: true,
    message: 'Order can be created successfully',
    preview: {
      items: orderItems,
      ...totals,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  });
});

/**
 * Get user's order history
 * GET /api/orders
 */
const getUserOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    page = 1, 
    limit = 10, 
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    sortBy,
    sortOrder
  };

  // Add date filtering if provided
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date('1970-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format. Use YYYY-MM-DD format.');
    }
    
    options.startDate = start;
    options.endDate = end;
  }

  // Get paginated order history
  const orderHistory = await orderRepository.getUserOrderHistory(userId, options);

  // Sanitize orders
  const sanitizedOrders = orderHistory.orders.map(order => sanitizeOrder(order));

  res.json({
    orders: sanitizedOrders,
    pagination: orderHistory.pagination,
    filters: {
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder
    },
    summary: {
      totalOrders: orderHistory.pagination.total,
      totalSpent: sanitizedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    }
  });
});

/**
 * Get specific order details
 * GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await orderRepository.findById(id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order (unless admin)
  if (req.user.role !== 'admin' && order.userId !== userId) {
    throw new NotFoundError('Order not found');
  }

  res.json({
    order: sanitizeOrder(order)
  });
});

/**
 * Get order tracking information
 * GET /api/orders/:id/tracking
 */
const getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await orderRepository.findById(id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order (unless admin)
  if (req.user.role !== 'admin' && order.userId !== userId) {
    throw new NotFoundError('Order not found');
  }

  // Generate tracking timeline based on order status
  const timeline = [];
  const orderDate = new Date(order.createdAt);

  timeline.push({
    status: 'pending',
    title: 'Order Placed',
    description: 'Your order has been received and is being processed',
    date: order.createdAt,
    completed: true
  });

  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'processing',
      title: 'Order Processing',
      description: 'Your order is being prepared for shipment',
      date: order.statusUpdatedAt || order.updatedAt,
      completed: true
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'shipped',
      title: 'Order Shipped',
      description: 'Your order has been shipped and is on its way',
      date: order.statusUpdatedAt || order.updatedAt,
      completed: true
    });
  }

  if (order.status === 'delivered') {
    timeline.push({
      status: 'delivered',
      title: 'Order Delivered',
      description: 'Your order has been delivered successfully',
      date: order.statusUpdatedAt || order.updatedAt,
      completed: true
    });
  }

  if (order.status === 'cancelled') {
    timeline.push({
      status: 'cancelled',
      title: 'Order Cancelled',
      description: 'Your order has been cancelled',
      date: order.statusUpdatedAt || order.updatedAt,
      completed: true
    });
  }

  // Add estimated delivery if not yet delivered
  let estimatedDelivery = null;
  if (['pending', 'processing', 'shipped'].includes(order.status)) {
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 days from order
    estimatedDelivery = deliveryDate.toISOString();

    if (order.status !== 'shipped') {
      timeline.push({
        status: 'delivered',
        title: 'Estimated Delivery',
        description: 'Estimated delivery date',
        date: estimatedDelivery,
        completed: false,
        estimated: true
      });
    }
  }

  res.json({
    orderId: order.id,
    currentStatus: order.status,
    timeline,
    estimatedDelivery,
    trackingInfo: {
      canCancel: canCancelOrder(order),
      canReturn: order.status === 'delivered',
      canReorder: ['delivered', 'cancelled'].includes(order.status)
    }
  });
});

/**
 * Get recent orders
 * GET /api/orders/recent
 */
const getRecentOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 5 } = req.query;

  const options = {
    page: 1,
    limit: parseInt(limit),
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  const orderHistory = await orderRepository.getUserOrderHistory(userId, options);
  const sanitizedOrders = orderHistory.orders.map(order => sanitizeOrder(order));

  res.json({
    orders: sanitizedOrders,
    count: sanitizedOrders.length
  });
});

/**
 * Get order summary for user
 * GET /api/orders/summary
 */
const getUserOrderSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get all user orders
  const allOrders = await orderRepository.findByUserId(userId);

  const summary = {
    totalOrders: allOrders.length,
    totalSpent: allOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    averageOrderValue: 0,
    statusBreakdown: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    },
    recentOrderDate: null,
    favoriteProducts: []
  };

  if (allOrders.length > 0) {
    summary.averageOrderValue = summary.totalSpent / summary.totalOrders;
    
    // Calculate status breakdown
    allOrders.forEach(order => {
      summary.statusBreakdown[order.status]++;
    });

    // Get most recent order date
    const sortedOrders = allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    summary.recentOrderDate = sortedOrders[0].createdAt;

    // Calculate favorite products (most frequently ordered)
    const productCounts = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            count: 0,
            totalQuantity: 0
          };
        }
        productCounts[item.productId].count++;
        productCounts[item.productId].totalQuantity += item.quantity;
      });
    });

    summary.favoriteProducts = Object.values(productCounts)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
  }

  res.json({
    summary
  });
});

/**
 * Reorder from previous order
 * POST /api/orders/:id/reorder
 */
const reorderFromOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await orderRepository.findById(id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order
  if (order.userId !== userId) {
    throw new NotFoundError('Order not found');
  }

  // Check if order can be reordered
  if (!['delivered', 'cancelled'].includes(order.status)) {
    throw new ValidationError('Order cannot be reordered at this stage');
  }

  // Get current cart
  const cart = await cartRepository.getOrCreateCart(userId);

  // Add order items to cart (check availability)
  const addedItems = [];
  const unavailableItems = [];

  for (const orderItem of order.items) {
    try {
      // Check if product still exists and has inventory
      const product = await productRepository.findById(orderItem.productId);
      if (!product) {
        unavailableItems.push({
          productId: orderItem.productId,
          productName: orderItem.productName,
          reason: 'Product no longer available'
        });
        continue;
      }

      const hasInventory = await productRepository.hasInventory(orderItem.productId, orderItem.quantity);
      if (!hasInventory) {
        unavailableItems.push({
          productId: orderItem.productId,
          productName: orderItem.productName,
          reason: `Only ${product.inventory} items available (requested ${orderItem.quantity})`
        });
        continue;
      }

      // Add to cart
      await cartRepository.addItem(userId, orderItem.productId, orderItem.quantity);
      addedItems.push({
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity: orderItem.quantity,
        price: product.price
      });

    } catch (error) {
      unavailableItems.push({
        productId: orderItem.productId,
        productName: orderItem.productName,
        reason: error.message
      });
    }
  }

  // Get updated cart with totals
  const cartWithProducts = await cartRepository.getCartWithProducts(
    userId,
    (productId) => productRepository.findById(productId)
  );

  res.json({
    message: 'Items added to cart from previous order',
    originalOrderId: order.id,
    addedItems,
    unavailableItems,
    summary: {
      totalItemsRequested: order.items.length,
      itemsAdded: addedItems.length,
      itemsUnavailable: unavailableItems.length
    },
    cart: cartWithProducts ? {
      itemCount: cartWithProducts.items.reduce((sum, item) => sum + item.quantity, 0),
      uniqueItems: cartWithProducts.items.length
    } : null
  });
});

/**
 * Get order processing statistics (admin only)
 * GET /api/orders/processing-stats
 */
const getProcessingStats = asyncHandler(async (req, res) => {
  const stats = {
    pending: (await orderRepository.findByStatus('pending')).length,
    processing: (await orderRepository.findByStatus('processing')).length,
    shipped: (await orderRepository.findByStatus('shipped')).length,
    delivered: (await orderRepository.findByStatus('delivered')).length,
    cancelled: (await orderRepository.findByStatus('cancelled')).length,
    needingAttention: (await orderRepository.findOrdersNeedingAttention()).length
  };

  const recentOrders = await orderRepository.getRecentOrders(7); // Last 7 days
  const orderStats = await orderRepository.getOrderStats();

  res.json({
    statusCounts: stats,
    recentActivity: {
      ordersLast7Days: recentOrders.length,
      totalRevenueLast7Days: recentOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    },
    overall: orderStats
  });
});

module.exports = {
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
};