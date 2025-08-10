const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const OrderRepository = require('../../repositories/OrderRepository');
const CartRepository = require('../../repositories/CartRepository');
const ProductRepository = require('../../repositories/ProductRepository');
const UserRepository = require('../../repositories/UserRepository');

// Mock repositories
jest.mock('../../repositories/OrderRepository');
jest.mock('../../repositories/CartRepository');
jest.mock('../../repositories/ProductRepository');
jest.mock('../../repositories/UserRepository');
jest.mock('bcryptjs');

describe('Order Controller', () => {
  let mockOrderRepository;
  let mockCartRepository;
  let mockProductRepository;
  let mockUserRepository;
  let userToken;
  let adminToken;

  beforeEach(() => {
    mockOrderRepository = {
      createOrder: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      cancelOrder: jest.fn(),
      findByStatus: jest.fn(),
      findOrdersNeedingAttention: jest.fn(),
      getRecentOrders: jest.fn(),
      getOrderStats: jest.fn(),
      getUserOrderHistory: jest.fn(),
      findByUserId: jest.fn()
    };

    mockCartRepository = {
      getCartWithProducts: jest.fn(),
      validateCart: jest.fn(),
      clearCart: jest.fn(),
      getOrCreateCart: jest.fn(),
      addItem: jest.fn()
    };

    mockProductRepository = {
      findById: jest.fn(),
      hasInventory: jest.fn(),
      updateInventory: jest.fn()
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updateLastLogin: jest.fn()
    };

    OrderRepository.mockImplementation(() => mockOrderRepository);
    CartRepository.mockImplementation(() => mockCartRepository);
    ProductRepository.mockImplementation(() => mockProductRepository);
    UserRepository.mockImplementation(() => mockUserRepository);

    // Mock user authentication
    const user = {
      id: 'user123',
      email: 'user@example.com',
      role: 'customer',
      firstName: 'Test',
      lastName: 'User'
    };

    const admin = {
      id: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    };

    mockUserRepository.findById
      .mockImplementation((id) => {
        if (id === 'user123') return Promise.resolve(user);
        if (id === 'admin123') return Promise.resolve(admin);
        return Promise.resolve(null);
      });

    mockUserRepository.findByEmail.mockImplementation((email) => {
      if (email === 'user@example.com') return Promise.resolve({ ...user, passwordHash: 'hashed-password' });
      if (email === 'admin@example.com') return Promise.resolve({ ...admin, passwordHash: 'hashed-password' });
      return Promise.resolve(null);
    });

    mockUserRepository.updateLastLogin.mockResolvedValue();
    bcrypt.compare.mockResolvedValue(true);

    userToken = 'valid-user-token';
    adminToken = 'valid-admin-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to get user token
  const getUserToken = async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'UserPassword123'
      });
    
    return loginResponse.body.tokens.accessToken;
  };

  // Helper function to get admin token
  const getAdminToken = async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123'
      });
    
    return loginResponse.body.tokens.accessToken;
  };

  describe('POST /api/orders', () => {
    const validOrderData = {
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      paymentInfo: {
        method: 'credit_card',
        cardLast4: '1234',
        cardBrand: 'visa',
        transactionId: 'txn_123456'
      }
    };

    it('should create order from cart successfully', async () => {
      const cartWithProducts = {
        id: 'cart123',
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 2,
            product: {
              id: 'product123',
              name: 'Test Product',
              price: 99.99,
              inventory: 10
            }
          }
        ]
      };

      const validation = {
        valid: true,
        errors: [],
        validItems: cartWithProducts.items
      };

      const createdOrder = {
        id: 'order123',
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            productName: 'Test Product',
            price: 99.99,
            quantity: 2
          }
        ],
        totalAmount: 199.98,
        status: 'pending',
        shippingAddress: validOrderData.shippingAddress,
        paymentInfo: validOrderData.paymentInfo,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      const updatedProduct = {
        id: 'product123',
        name: 'Test Product',
        inventory: 8
      };

      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);
      mockCartRepository.validateCart.mockResolvedValue(validation);
      mockProductRepository.hasInventory.mockResolvedValue(true);
      mockOrderRepository.createOrder.mockResolvedValue(createdOrder);
      mockProductRepository.updateInventory.mockResolvedValue(updatedProduct);
      mockCartRepository.clearCart.mockResolvedValue({});

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(validOrderData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Order created successfully',
        order: {
          id: 'order123',
          userId: 'user123',
          totalAmount: 199.98,
          status: 'pending'
        },
        inventoryUpdates: expect.any(Array),
        summary: {
          itemCount: 1,
          totalAmount: 199.98,
          estimatedDelivery: expect.any(String)
        }
      });

      expect(mockOrderRepository.createOrder).toHaveBeenCalled();
      expect(mockProductRepository.updateInventory).toHaveBeenCalledWith('product123', -2);
      expect(mockCartRepository.clearCart).toHaveBeenCalledWith('user123');
    });

    it('should reject order creation with empty cart', async () => {
      mockCartRepository.getCartWithProducts.mockResolvedValue({ items: [] });

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(validOrderData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Error',
        message: 'Cart is empty. Cannot create order.'
      });
    });

    it('should reject order creation with invalid cart items', async () => {
      const cartWithProducts = {
        items: [
          {
            productId: 'product123',
            quantity: 5,
            product: { id: 'product123', name: 'Test Product', inventory: 2 }
          }
        ]
      };

      const validation = {
        valid: false,
        errors: [
          {
            productId: 'product123',
            error: 'Insufficient inventory',
            requested: 5,
            available: 2
          }
        ]
      };

      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);
      mockCartRepository.validateCart.mockResolvedValue(validation);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(validOrderData)
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Cart contains invalid items. Please review your cart.'
      });
    });

    it('should validate order data', async () => {
      const invalidOrderData = {
        shippingAddress: {
          firstName: '', // Empty required field
          street: '123 Main St'
        },
        paymentInfo: {
          method: 'invalid_method' // Invalid payment method
        }
      };

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidOrderData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/orders/validate', () => {
    const validOrderData = {
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      paymentInfo: {
        method: 'credit_card',
        cardLast4: '1234',
        cardBrand: 'visa'
      }
    };

    it('should validate order creation successfully', async () => {
      const cartWithProducts = {
        items: [
          {
            productId: 'product123',
            quantity: 2,
            product: {
              id: 'product123',
              name: 'Test Product',
              price: 99.99
            }
          }
        ]
      };

      const validation = {
        valid: true,
        errors: [],
        validItems: cartWithProducts.items
      };

      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);
      mockCartRepository.validateCart.mockResolvedValue(validation);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/validate')
        .set('Authorization', `Bearer ${token}`)
        .send(validOrderData)
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        message: 'Order can be created successfully',
        preview: {
          items: expect.any(Array),
          subtotal: 199.98,
          total: 199.98,
          estimatedDelivery: expect.any(String)
        }
      });
    });

    it('should return validation errors for empty cart', async () => {
      mockCartRepository.getCartWithProducts.mockResolvedValue({ items: [] });

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/validate')
        .set('Authorization', `Bearer ${token}`)
        .send(validOrderData)
        .expect(200);

      expect(response.body).toMatchObject({
        valid: false,
        message: 'Cannot create order from empty cart'
      });
    });

    it('should return validation errors for invalid cart', async () => {
      const cartWithProducts = {
        items: [
          {
            productId: 'product123',
            quantity: 5,
            product: { name: 'Test Product', inventory: 2 }
          }
        ]
      };

      const validation = {
        valid: false,
        errors: [
          {
            productId: 'product123',
            error: 'Insufficient inventory'
          }
        ]
      };

      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);
      mockCartRepository.validateCart.mockResolvedValue(validation);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/validate')
        .set('Authorization', `Bearer ${token}`)
        .send(validOrderData)
        .expect(200);

      expect(response.body).toMatchObject({
        valid: false,
        message: 'Cart contains invalid items'
      });
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status successfully (admin)', async () => {
      const existingOrder = {
        id: 'order123',
        userId: 'user123',
        status: 'pending',
        items: []
      };

      const updatedOrder = {
        ...existingOrder,
        status: 'processing'
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);
      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder);

      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/orders/order123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Order status updated successfully',
        order: {
          id: 'order123',
          status: 'processing'
        },
        previousStatus: 'pending',
        newStatus: 'processing'
      });

      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order123', 'processing');
    });

    it('should allow customer to cancel their own order', async () => {
      const existingOrder = {
        id: 'order123',
        userId: 'user123',
        status: 'pending',
        items: [
          {
            productId: 'product123',
            productName: 'Test Product',
            quantity: 2
          }
        ]
      };

      const cancelledOrder = {
        ...existingOrder,
        status: 'cancelled'
      };

      const updatedProduct = {
        id: 'product123',
        inventory: 12
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);
      mockOrderRepository.updateStatus.mockResolvedValue(cancelledOrder);
      mockProductRepository.updateInventory.mockResolvedValue(updatedProduct);

      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/orders/order123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Order cancelled successfully',
        order: {
          id: 'order123',
          status: 'cancelled'
        },
        inventoryRestorations: expect.any(Array)
      });

      expect(mockProductRepository.updateInventory).toHaveBeenCalledWith('product123', 2);
    });

    it('should prevent customer from updating to non-cancel status', async () => {
      const existingOrder = {
        id: 'order123',
        userId: 'user123',
        status: 'pending'
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);

      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/orders/order123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'processing' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Error',
        message: 'You can only cancel orders'
      });
    });

    it('should prevent cancelling non-cancellable orders', async () => {
      const existingOrder = {
        id: 'order123',
        userId: 'user123',
        status: 'delivered'
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);

      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/orders/order123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Error',
        message: 'Order cannot be cancelled at this stage'
      });
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/orders/nonexistent/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should prevent users from accessing other users orders', async () => {
      const existingOrder = {
        id: 'order123',
        userId: 'otheruser123',
        status: 'pending'
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);

      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/orders/order123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    it('should cancel order successfully', async () => {
      const existingOrder = {
        id: 'order123',
        userId: 'user123',
        status: 'pending',
        totalAmount: 199.98,
        paymentInfo: { method: 'credit_card' },
        items: [
          {
            productId: 'product123',
            productName: 'Test Product',
            quantity: 2
          }
        ]
      };

      const cancelledOrder = {
        ...existingOrder,
        status: 'cancelled'
      };

      const updatedProduct = {
        id: 'product123',
        inventory: 12
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);
      mockOrderRepository.cancelOrder.mockResolvedValue(cancelledOrder);
      mockProductRepository.updateInventory.mockResolvedValue(updatedProduct);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/order123/cancel')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Order cancelled successfully',
        order: {
          id: 'order123',
          status: 'cancelled'
        },
        inventoryRestorations: expect.any(Array),
        refundInfo: {
          amount: 199.98,
          method: 'credit_card',
          estimatedRefundTime: '3-5 business days'
        }
      });

      expect(mockOrderRepository.cancelOrder).toHaveBeenCalledWith('order123');
      expect(mockProductRepository.updateInventory).toHaveBeenCalledWith('product123', 2);
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/nonexistent/cancel')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('GET /api/orders/processing-stats', () => {
    it('should get processing statistics (admin only)', async () => {
      const statusCounts = {
        pending: [{ id: '1' }, { id: '2' }],
        processing: [{ id: '3' }],
        shipped: [{ id: '4' }],
        delivered: [{ id: '5' }],
        cancelled: [],
        needingAttention: [{ id: '6' }]
      };

      const recentOrders = [
        { id: '1', totalAmount: 100 },
        { id: '2', totalAmount: 200 }
      ];

      const orderStats = {
        totalOrders: 10,
        totalRevenue: 1000,
        averageOrderValue: 100
      };

      mockOrderRepository.findByStatus
        .mockResolvedValueOnce(statusCounts.pending)
        .mockResolvedValueOnce(statusCounts.processing)
        .mockResolvedValueOnce(statusCounts.shipped)
        .mockResolvedValueOnce(statusCounts.delivered)
        .mockResolvedValueOnce(statusCounts.cancelled);

      mockOrderRepository.findOrdersNeedingAttention.mockResolvedValue(statusCounts.needingAttention);
      mockOrderRepository.getRecentOrders.mockResolvedValue(recentOrders);
      mockOrderRepository.getOrderStats.mockResolvedValue(orderStats);

      const token = await getAdminToken();
      const response = await request(app)
        .get('/api/orders/processing-stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        statusCounts: {
          pending: 2,
          processing: 1,
          shipped: 1,
          delivered: 1,
          cancelled: 0,
          needingAttention: 1
        },
        recentActivity: {
          ordersLast7Days: 2,
          totalRevenueLast7Days: 300
        },
        overall: orderStats
      });
    });

    it('should require admin role', async () => {
      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/processing-stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('GET /api/orders', () => {
    it('should get user order history successfully', async () => {
      const orderHistory = {
        orders: [
          {
            id: 'order1',
            userId: 'user123',
            totalAmount: 199.98,
            status: 'delivered',
            createdAt: '2023-01-01T00:00:00.000Z'
          },
          {
            id: 'order2',
            userId: 'user123',
            totalAmount: 99.99,
            status: 'pending',
            createdAt: '2023-01-02T00:00:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      mockOrderRepository.getUserOrderHistory.mockResolvedValue(orderHistory);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        orders: expect.any(Array),
        pagination: orderHistory.pagination,
        filters: expect.any(Object),
        summary: {
          totalOrders: 2,
          totalSpent: 299.97
        }
      });

      expect(mockOrderRepository.getUserOrderHistory).toHaveBeenCalledWith('user123', expect.any(Object));
    });

    it('should filter orders by status', async () => {
      const orderHistory = {
        orders: [
          {
            id: 'order1',
            userId: 'user123',
            status: 'delivered',
            totalAmount: 199.98
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      mockOrderRepository.getUserOrderHistory.mockResolvedValue(orderHistory);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders?status=delivered&page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.filters.status).toBe('delivered');
      expect(mockOrderRepository.getUserOrderHistory).toHaveBeenCalledWith('user123', expect.objectContaining({
        status: 'delivered',
        page: 1,
        limit: 10
      }));
    });

    it('should validate date filters', async () => {
      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders?startDate=invalid-date')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Error',
        message: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order details successfully', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        totalAmount: 199.98,
        status: 'delivered',
        items: [
          {
            productId: 'product123',
            productName: 'Test Product',
            price: 99.99,
            quantity: 2
          }
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main St'
        },
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockOrderRepository.findById.mockResolvedValue(order);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/order123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        order: {
          id: 'order123',
          userId: 'user123',
          totalAmount: 199.98,
          status: 'delivered'
        }
      });

      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order123');
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should prevent users from accessing other users orders', async () => {
      const order = {
        id: 'order123',
        userId: 'otheruser123',
        status: 'delivered'
      };

      mockOrderRepository.findById.mockResolvedValue(order);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/order123')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('GET /api/orders/:id/tracking', () => {
    it('should get order tracking information', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'shipped',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
        statusUpdatedAt: '2023-01-02T00:00:00.000Z'
      };

      mockOrderRepository.findById.mockResolvedValue(order);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/order123/tracking')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        orderId: 'order123',
        currentStatus: 'shipped',
        timeline: expect.any(Array),
        estimatedDelivery: expect.any(String),
        trackingInfo: {
          canCancel: false,
          canReturn: false,
          canReorder: false
        }
      });

      expect(response.body.timeline).toHaveLength(3); // pending, processing, shipped
    });

    it('should show cancelled order timeline', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'cancelled',
        createdAt: '2023-01-01T00:00:00.000Z',
        statusUpdatedAt: '2023-01-01T12:00:00.000Z'
      };

      mockOrderRepository.findById.mockResolvedValue(order);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/order123/tracking')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.currentStatus).toBe('cancelled');
      expect(response.body.timeline.some(item => item.status === 'cancelled')).toBe(true);
      expect(response.body.trackingInfo.canReorder).toBe(true);
    });
  });

  describe('GET /api/orders/recent', () => {
    it('should get recent orders', async () => {
      const orderHistory = {
        orders: [
          {
            id: 'order1',
            userId: 'user123',
            totalAmount: 199.98,
            status: 'delivered',
            createdAt: '2023-01-02T00:00:00.000Z'
          },
          {
            id: 'order2',
            userId: 'user123',
            totalAmount: 99.99,
            status: 'pending',
            createdAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };

      mockOrderRepository.getUserOrderHistory.mockResolvedValue(orderHistory);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/recent?limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        orders: expect.any(Array),
        count: 2
      });

      expect(mockOrderRepository.getUserOrderHistory).toHaveBeenCalledWith('user123', {
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });
  });

  describe('GET /api/orders/summary', () => {
    it('should get user order summary', async () => {
      const allOrders = [
        {
          id: 'order1',
          totalAmount: 199.98,
          status: 'delivered',
          createdAt: '2023-01-01T00:00:00.000Z',
          items: [
            { productId: 'product1', productName: 'Product 1', quantity: 2 }
          ]
        },
        {
          id: 'order2',
          totalAmount: 99.99,
          status: 'pending',
          createdAt: '2023-01-02T00:00:00.000Z',
          items: [
            { productId: 'product1', productName: 'Product 1', quantity: 1 }
          ]
        }
      ];

      mockOrderRepository.findByUserId.mockResolvedValue(allOrders);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        summary: {
          totalOrders: 2,
          totalSpent: 299.97,
          averageOrderValue: 149.985,
          statusBreakdown: {
            pending: 1,
            processing: 0,
            shipped: 0,
            delivered: 1,
            cancelled: 0
          },
          recentOrderDate: '2023-01-02T00:00:00.000Z',
          favoriteProducts: expect.any(Array)
        }
      });

      expect(response.body.summary.favoriteProducts[0]).toMatchObject({
        productId: 'product1',
        productName: 'Product 1',
        totalQuantity: 3
      });
    });

    it('should handle empty order history', async () => {
      mockOrderRepository.findByUserId.mockResolvedValue([]);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/orders/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.summary).toMatchObject({
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        recentOrderDate: null,
        favoriteProducts: []
      });
    });
  });

  describe('POST /api/orders/:id/reorder', () => {
    it('should reorder from previous order successfully', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'delivered',
        items: [
          {
            productId: 'product123',
            productName: 'Test Product',
            quantity: 2
          }
        ]
      };

      const product = {
        id: 'product123',
        name: 'Test Product',
        price: 99.99,
        inventory: 10
      };

      const cart = { id: 'cart123', userId: 'user123', items: [] };
      const cartWithProducts = {
        ...cart,
        items: [
          {
            productId: 'product123',
            quantity: 2,
            product: product
          }
        ]
      };

      mockOrderRepository.findById.mockResolvedValue(order);
      mockCartRepository.getOrCreateCart.mockResolvedValue(cart);
      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(true);
      mockCartRepository.addItem.mockResolvedValue({});
      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/order123/reorder')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Items added to cart from previous order',
        originalOrderId: 'order123',
        addedItems: expect.any(Array),
        unavailableItems: expect.any(Array),
        summary: {
          totalItemsRequested: 1,
          itemsAdded: 1,
          itemsUnavailable: 0
        }
      });

      expect(mockCartRepository.addItem).toHaveBeenCalledWith('user123', 'product123', 2);
    });

    it('should handle unavailable products during reorder', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'delivered',
        items: [
          {
            productId: 'product123',
            productName: 'Test Product',
            quantity: 5
          }
        ]
      };

      const product = {
        id: 'product123',
        name: 'Test Product',
        inventory: 2
      };

      mockOrderRepository.findById.mockResolvedValue(order);
      mockCartRepository.getOrCreateCart.mockResolvedValue({});
      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(false);
      mockCartRepository.getCartWithProducts.mockResolvedValue({ items: [] });

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/order123/reorder')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.summary).toMatchObject({
        totalItemsRequested: 1,
        itemsAdded: 0,
        itemsUnavailable: 1
      });

      expect(response.body.unavailableItems[0]).toMatchObject({
        productId: 'product123',
        productName: 'Test Product',
        reason: 'Only 2 items available (requested 5)'
      });
    });

    it('should prevent reordering non-reorderable orders', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'pending'
      };

      mockOrderRepository.findById.mockResolvedValue(order);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/order123/reorder')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Error',
        message: 'Order cannot be reordered at this stage'
      });
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/orders/nonexistent/reorder')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });
});