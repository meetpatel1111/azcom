const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const CartRepository = require('../../repositories/CartRepository');
const ProductRepository = require('../../repositories/ProductRepository');
const UserRepository = require('../../repositories/UserRepository');

// Mock repositories
jest.mock('../../repositories/CartRepository');
jest.mock('../../repositories/ProductRepository');
jest.mock('../../repositories/UserRepository');
jest.mock('bcryptjs');

describe('Cart Controller', () => {
  let mockCartRepository;
  let mockProductRepository;
  let mockUserRepository;
  let userToken;

  beforeEach(() => {
    mockCartRepository = {
      getCartWithProducts: jest.fn(),
      getOrCreateCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartSummary: jest.fn(),
      validateCart: jest.fn(),
      findByUserId: jest.fn(),
      clearCart: jest.fn()
    };

    mockProductRepository = {
      findById: jest.fn(),
      hasInventory: jest.fn()
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updateLastLogin: jest.fn()
    };

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

    mockUserRepository.findById.mockResolvedValue(user);
    mockUserRepository.findByEmail.mockResolvedValue({
      ...user,
      passwordHash: 'hashed-password'
    });
    mockUserRepository.updateLastLogin.mockResolvedValue();
    bcrypt.compare.mockResolvedValue(true);

    userToken = 'valid-user-token';
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

  describe('GET /api/cart', () => {
    it('should get user cart with products successfully', async () => {
      const cartWithProducts = {
        id: 'cart123',
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 2,
            addedAt: '2023-01-01T00:00:00.000Z',
            product: {
              id: 'product123',
              name: 'Test Product',
              price: 99.99,
              imageUrl: 'https://example.com/image.jpg'
            }
          }
        ],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        cart: {
          id: 'cart123',
          userId: 'user123',
          items: expect.any(Array)
        },
        itemCount: 2,
        uniqueItems: 1,
        subtotal: 199.98,
        total: 199.98
      });

      expect(mockCartRepository.getCartWithProducts).toHaveBeenCalledWith(
        'user123',
        expect.any(Function)
      );
    });

    it('should create empty cart if none exists', async () => {
      const emptyCart = {
        id: 'cart123',
        userId: 'user123',
        items: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockCartRepository.getCartWithProducts.mockResolvedValue(null);
      mockCartRepository.getOrCreateCart.mockResolvedValue(emptyCart);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        cart: emptyCart,
        itemCount: 0,
        uniqueItems: 0,
        subtotal: 0,
        total: 0
      });

      expect(mockCartRepository.getOrCreateCart).toHaveBeenCalledWith('user123');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/cart/items', () => {
    const addItemData = {
      productId: 'product123',
      quantity: 2
    };

    it('should add item to cart successfully', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        price: 99.99,
        inventory: 10
      };

      const updatedCart = {
        id: 'cart123',
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 2,
            addedAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };

      const cartWithProducts = {
        ...updatedCart,
        items: [
          {
            ...updatedCart.items[0],
            product: product
          }
        ]
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(true);
      mockCartRepository.addItem.mockResolvedValue(updatedCart);
      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send(addItemData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Item added to cart successfully',
        cart: expect.any(Object),
        addedItem: {
          productId: 'product123',
          productName: 'Test Product',
          quantity: 2,
          price: 99.99
        },
        itemCount: 2,
        subtotal: 199.98
      });

      expect(mockProductRepository.findById).toHaveBeenCalledWith('product123');
      expect(mockProductRepository.hasInventory).toHaveBeenCalledWith('product123', 2);
      expect(mockCartRepository.addItem).toHaveBeenCalledWith('user123', 'product123', 2);
    });

    it('should reject adding non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send(addItemData)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Product not found'
      });
    });

    it('should reject adding item with insufficient inventory', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        inventory: 1
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(false);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'product123', quantity: 5 })
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Insufficient inventory. Only 1 items available.'
      });
    });

    it('should validate add to cart data', async () => {
      const invalidData = {
        productId: 'invalid-uuid',
        quantity: 0
      };

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send(addItemData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/cart/summary', () => {
    it('should get cart summary successfully', async () => {
      const cartSummary = {
        id: 'cart123',
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 2,
            product: { price: 99.99 }
          }
        ],
        itemCount: 2,
        uniqueItems: 1,
        subtotal: 199.98,
        total: 199.98
      };

      mockCartRepository.getCartSummary.mockResolvedValue(cartSummary);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        ...cartSummary,
        isEmpty: false
      });
    });

    it('should return empty summary for non-existent cart', async () => {
      mockCartRepository.getCartSummary.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        itemCount: 0,
        uniqueItems: 0,
        subtotal: 0,
        total: 0,
        isEmpty: true
      });
    });
  });

  describe('GET /api/cart/validate', () => {
    it('should validate cart successfully', async () => {
      const validation = {
        valid: true,
        errors: [],
        validItems: [
          { productId: 'product123', quantity: 2 }
        ]
      };

      mockCartRepository.validateCart.mockResolvedValue(validation);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/validate')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        errors: [],
        validItems: expect.any(Array),
        summary: {
          totalItems: 1,
          validItems: 1,
          invalidItems: 0
        }
      });
    });

    it('should return validation errors', async () => {
      const validation = {
        valid: false,
        errors: [
          {
            productId: 'product123',
            error: 'Insufficient inventory',
            requested: 5,
            available: 2
          }
        ],
        validItems: []
      };

      mockCartRepository.validateCart.mockResolvedValue(validation);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/validate')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        valid: false,
        errors: expect.any(Array),
        summary: {
          totalItems: 1,
          validItems: 0,
          invalidItems: 1
        }
      });
    });
  });

  describe('GET /api/cart/count', () => {
    it('should get cart item count', async () => {
      const cart = {
        items: [
          { productId: 'product1', quantity: 2 },
          { productId: 'product2', quantity: 3 }
        ]
      };

      mockCartRepository.findByUserId.mockResolvedValue(cart);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 5,
        uniqueItems: 2
      });
    });

    it('should return zero for empty cart', async () => {
      mockCartRepository.findByUserId.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 0
      });
    });
  });

  describe('GET /api/cart/items/:productId', () => {
    it('should check if product is in cart', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        price: 99.99,
        inventory: 10
      };

      const cart = {
        items: [
          {
            productId: 'product123',
            quantity: 2,
            addedAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findByUserId.mockResolvedValue(cart);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        inCart: true,
        quantity: 2,
        addedAt: '2023-01-01T00:00:00.000Z',
        product: {
          id: 'product123',
          name: 'Test Product',
          price: 99.99,
          inventory: 10
        }
      });
    });

    it('should return false for product not in cart', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        price: 99.99
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findByUserId.mockResolvedValue({ items: [] });

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        inCart: false,
        quantity: 0,
        addedAt: null
      });
    });

    it('should return 404 for non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/items/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('GET /api/cart/recent', () => {
    it('should get recent cart items', async () => {
      const cart = {
        items: [
          {
            productId: 'product1',
            quantity: 2,
            addedAt: '2023-01-02T00:00:00.000Z'
          },
          {
            productId: 'product2',
            quantity: 1,
            addedAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };

      const product1 = { id: 'product1', name: 'Product 1', price: 99.99 };
      const product2 = { id: 'product2', name: 'Product 2', price: 149.99 };

      mockCartRepository.findByUserId.mockResolvedValue(cart);
      mockProductRepository.findById
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/recent?limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        items: expect.any(Array),
        count: 2
      });

      // Should be sorted by most recent first
      expect(response.body.items[0].productId).toBe('product1');
      expect(response.body.items[1].productId).toBe('product2');
    });

    it('should return empty array for empty cart', async () => {
      mockCartRepository.findByUserId.mockResolvedValue({ items: [] });

      const token = await getUserToken();
      const response = await request(app)
        .get('/api/cart/recent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        items: [],
        count: 0
      });
    });
  });

  describe('PUT /api/cart/items/:productId', () => {
    it('should update cart item quantity successfully', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        price: 99.99,
        inventory: 10
      };

      const updatedCart = {
        id: 'cart123',
        userId: 'user123',
        items: [
          {
            productId: 'product123',
            quantity: 3,
            addedAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };

      const cartWithProducts = {
        ...updatedCart,
        items: [
          {
            ...updatedCart.items[0],
            product: product
          }
        ]
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(true);
      mockCartRepository.updateItemQuantity.mockResolvedValue(updatedCart);
      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .put('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Cart item updated successfully',
        cart: expect.any(Object),
        updatedItem: {
          productId: 'product123',
          productName: 'Test Product',
          quantity: 3,
          price: 99.99
        },
        itemCount: 3,
        subtotal: 299.97
      });

      expect(mockCartRepository.updateItemQuantity).toHaveBeenCalledWith('user123', 'product123', 3);
    });

    it('should remove item when quantity is 0', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        price: 99.99
      };

      const updatedCart = {
        id: 'cart123',
        userId: 'user123',
        items: []
      };

      const cartWithProducts = {
        ...updatedCart,
        items: []
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.removeItem.mockResolvedValue(updatedCart);
      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .put('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Item removed from cart successfully',
        removedItem: {
          productId: 'product123',
          productName: 'Test Product'
        },
        itemCount: 0
      });

      expect(mockCartRepository.removeItem).toHaveBeenCalledWith('user123', 'product123');
    });

    it('should reject update with insufficient inventory', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        inventory: 2
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(false);

      const token = await getUserToken();
      const response = await request(app)
        .put('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 5 })
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Insufficient inventory. Only 2 items available.'
      });
    });

    it('should return 404 for non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .put('/api/cart/items/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 2 })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should return 404 for non-existent cart item', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        inventory: 10
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(true);
      mockCartRepository.updateItemQuantity.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .put('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 2 })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should validate quantity', async () => {
      const token = await getUserToken();
      const response = await request(app)
        .put('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: -1 })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('DELETE /api/cart/items/:productId', () => {
    it('should remove item from cart successfully', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product',
        price: 99.99
      };

      const updatedCart = {
        id: 'cart123',
        userId: 'user123',
        items: []
      };

      const cartWithProducts = {
        ...updatedCart,
        items: []
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.removeItem.mockResolvedValue(updatedCart);
      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .delete('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Item removed from cart successfully',
        removedItem: {
          productId: 'product123',
          productName: 'Test Product'
        },
        itemCount: 0
      });

      expect(mockCartRepository.removeItem).toHaveBeenCalledWith('user123', 'product123');
    });

    it('should return 404 for non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .delete('/api/cart/items/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should return 404 for non-existent cart item', async () => {
      const product = {
        id: 'product123',
        name: 'Test Product'
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.removeItem.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .delete('/api/cart/items/product123')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('PATCH /api/cart/items', () => {
    it('should update multiple items successfully', async () => {
      const items = [
        { productId: 'product1', quantity: 2 },
        { productId: 'product2', quantity: 3 }
      ];

      const product1 = { id: 'product1', name: 'Product 1', inventory: 10 };
      const product2 = { id: 'product2', name: 'Product 2', inventory: 10 };

      const updatedCart = {
        id: 'cart123',
        userId: 'user123',
        items: [
          { productId: 'product1', quantity: 2 },
          { productId: 'product2', quantity: 3 }
        ]
      };

      const cartWithProducts = {
        ...updatedCart,
        items: [
          { ...updatedCart.items[0], product: { ...product1, price: 99.99 } },
          { ...updatedCart.items[1], product: { ...product2, price: 149.99 } }
        ]
      };

      mockProductRepository.findById
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);
      mockProductRepository.hasInventory
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);
      mockCartRepository.updateItemQuantity
        .mockResolvedValueOnce(updatedCart)
        .mockResolvedValueOnce(updatedCart);
      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ items })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Bulk cart update completed',
        summary: {
          total: 2,
          successful: 2,
          failed: 0
        }
      });

      expect(response.body.results.successful).toHaveLength(2);
    });

    it('should handle partial failures', async () => {
      const items = [
        { productId: 'product1', quantity: 2 },
        { productId: 'nonexistent', quantity: 1 }
      ];

      const product1 = { id: 'product1', name: 'Product 1', inventory: 10 };

      mockProductRepository.findById
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(null);
      mockProductRepository.hasInventory.mockResolvedValueOnce(true);
      mockCartRepository.updateItemQuantity.mockResolvedValueOnce({});
      mockCartRepository.getCartWithProducts.mockResolvedValue({
        items: [{ productId: 'product1', quantity: 2, product: { price: 99.99 } }]
      });

      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ items })
        .expect(200);

      expect(response.body.summary).toMatchObject({
        total: 2,
        successful: 1,
        failed: 1
      });

      expect(response.body.results.successful).toHaveLength(1);
      expect(response.body.results.failed).toHaveLength(1);
    });

    it('should validate bulk update input', async () => {
      const token = await getUserToken();
      const response = await request(app)
        .patch('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/cart/sync', () => {
    it('should sync cart with inventory successfully', async () => {
      const validation = {
        valid: false,
        errors: [
          {
            productId: 'product1',
            productName: 'Product 1',
            error: 'Insufficient inventory',
            requested: 5,
            available: 2
          },
          {
            productId: 'product2',
            error: 'Product no longer exists'
          }
        ],
        validItems: []
      };

      const syncedCart = {
        id: 'cart123',
        userId: 'user123',
        items: [
          { productId: 'product1', quantity: 2 }
        ]
      };

      const cartWithProducts = {
        ...syncedCart,
        items: [
          { ...syncedCart.items[0], product: { price: 99.99 } }
        ]
      };

      mockCartRepository.validateCart.mockResolvedValue(validation);
      mockCartRepository.updateItemQuantity.mockResolvedValue({});
      mockCartRepository.removeItem.mockResolvedValue({});
      mockCartRepository.getCartWithProducts.mockResolvedValue(cartWithProducts);

      const token = await getUserToken();
      const response = await request(app)
        .post('/api/cart/sync')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Cart synchronized with inventory',
        summary: {
          itemsRemoved: 1,
          itemsUpdated: 1,
          totalChanges: 2
        }
      });

      expect(response.body.changes.removedItems).toHaveLength(1);
      expect(response.body.changes.updatedItems).toHaveLength(1);
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear cart successfully', async () => {
      const clearedCart = {
        id: 'cart123',
        userId: 'user123',
        items: []
      };

      mockCartRepository.clearCart.mockResolvedValue(clearedCart);

      const token = await getUserToken();
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Cart cleared successfully',
        cart: clearedCart
      });

      expect(mockCartRepository.clearCart).toHaveBeenCalledWith('user123');
    });

    it('should return 404 if cart not found', async () => {
      mockCartRepository.clearCart.mockResolvedValue(null);

      const token = await getUserToken();
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });
});