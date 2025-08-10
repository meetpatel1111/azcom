const BaseRepository = require('./BaseRepository');

class OrderRepository extends BaseRepository {
  constructor(fileManager = null) {
    super('orders.json', fileManager);
  }

  /**
   * Find orders by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's orders
   */
  async findByUserId(userId) {
    return this.findWhere(order => order.userId === userId);
  }

  /**
   * Find orders by status
   * @param {string} status - Order status
   * @returns {Promise<Array>} Orders with specified status
   */
  async findByStatus(status) {
    return this.findWhere(order => order.status === status);
  }

  /**
   * Create order from cart
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    const order = {
      ...orderData,
      status: orderData.status || 'pending'
    };

    return this.create(order);
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} Updated order or null
   */
  async updateStatus(orderId, status) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }

    return this.update(orderId, { 
      status,
      statusUpdatedAt: new Date().toISOString()
    });
  }

  /**
   * Get user's order history with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Paginated order history
   */
  async getUserOrderHistory(userId, options = {}) {
    let orders = await this.findByUserId(userId);

    // Apply status filter
    if (options.status) {
      orders = orders.filter(order => order.status === options.status);
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = orders.length;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;
    
    const paginatedOrders = orders.slice(offset, offset + limit);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get orders within date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Orders within date range
   */
  async findByDateRange(startDate, endDate) {
    return this.findWhere(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  /**
   * Get recent orders (last N days)
   * @param {number} days - Number of days
   * @returns {Promise<Array>} Recent orders
   */
  async getRecentOrders(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();
    
    return this.findByDateRange(startDate, endDate);
  }

  /**
   * Calculate order totals and statistics
   * @param {Array} orders - Array of orders
   * @returns {Object} Order statistics
   */
  calculateOrderStats(orders) {
    const stats = {
      totalOrders: orders.length,
      totalRevenue: 0,
      averageOrderValue: 0,
      statusBreakdown: {},
      monthlyRevenue: {}
    };

    if (orders.length === 0) {
      return stats;
    }

    // Calculate totals and status breakdown
    orders.forEach(order => {
      stats.totalRevenue += order.totalAmount || 0;
      
      // Status breakdown
      stats.statusBreakdown[order.status] = (stats.statusBreakdown[order.status] || 0) + 1;
      
      // Monthly revenue
      const month = new Date(order.createdAt).toISOString().substring(0, 7); // YYYY-MM
      stats.monthlyRevenue[month] = (stats.monthlyRevenue[month] || 0) + (order.totalAmount || 0);
    });

    stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;

    return stats;
  }

  /**
   * Get order statistics for date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStats(startDate = null, endDate = null) {
    let orders;
    
    if (startDate && endDate) {
      orders = await this.findByDateRange(startDate, endDate);
    } else {
      orders = await this.findAll();
    }

    return this.calculateOrderStats(orders);
  }

  /**
   * Get top customers by order value
   * @param {number} limit - Number of top customers to return
   * @returns {Promise<Array>} Top customers
   */
  async getTopCustomers(limit = 10) {
    const orders = await this.findAll();
    const customerStats = {};

    // Aggregate orders by customer
    orders.forEach(order => {
      if (!customerStats[order.userId]) {
        customerStats[order.userId] = {
          userId: order.userId,
          totalOrders: 0,
          totalSpent: 0
        };
      }
      
      customerStats[order.userId].totalOrders++;
      customerStats[order.userId].totalSpent += order.totalAmount || 0;
    });

    // Convert to array and sort by total spent
    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    return topCustomers;
  }

  /**
   * Find orders that need attention (old pending/processing orders)
   * @param {number} hours - Hours since creation
   * @returns {Promise<Array>} Orders needing attention
   */
  async findOrdersNeedingAttention(hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.findWhere(order => 
      (order.status === 'pending' || order.status === 'processing') &&
      new Date(order.createdAt) < cutoffDate
    );
  }

  /**
   * Cancel order if possible
   * @param {string} orderId - Order ID
   * @returns {Promise<Object|null>} Updated order or null
   */
  async cancelOrder(orderId) {
    const order = await this.findById(orderId);
    if (!order) {
      return null;
    }

    // Only allow cancellation of pending or processing orders
    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    return this.updateStatus(orderId, 'cancelled');
  }

  /**
   * Get order summary for admin dashboard
   * @returns {Promise<Object>} Order summary
   */
  async getOrderSummary() {
    const orders = await this.findAll();
    const recentOrders = await this.getRecentOrders(30);
    const pendingOrders = await this.findByStatus('pending');
    const processingOrders = await this.findByStatus('processing');

    const stats = this.calculateOrderStats(orders);
    const recentStats = this.calculateOrderStats(recentOrders);

    return {
      total: stats,
      recent: recentStats,
      pending: pendingOrders.length,
      processing: processingOrders.length,
      needingAttention: (await this.findOrdersNeedingAttention()).length
    };
  }
}

module.exports = OrderRepository;