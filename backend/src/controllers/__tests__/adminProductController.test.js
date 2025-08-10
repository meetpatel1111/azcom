const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const ProductRepository = require('../../repositories/ProductRepository');
const UserRepository = require('../../repositories/UserRepository');

// Mock repositories
jest.mock('../../repositories/ProductRepository');
jest.mock('../../repositories/UserRepository');
jest.mock('bcryptjs');

describe('Admin Product Controller', () => {
  let mockProductRepository;
  let mockUserRepository;
  let adminToken;

  beforeEach(() => {
    mockProductRepository = {
      search: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updateLastLogin: jest.fn()
    };

    ProductRepository.mockImplementation(() => mockProductRepository);
    UserRepository.mockImplementation(() => mockUserRepository);

    // Mock admin authentication
    const adminUser = {
      id: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    };

    mockUserRepository.findById.mockResolvedValue(adminUser);
    mockUserRepository.findByEmail.mockResolvedValue({
      ...adminUser,
      passwordHash: 'hashed-password'
    });
    mockUserRepository.updateLastLogin.mockResolvedValue();
    bcrypt.compare.mockResolvedValue(true);

    adminToken = 'valid-admin-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  describe('POST /api/products', () => {
    const validProductData = {
      name: 'New Test Product',
      description: 'A test product for admin creation',
      price: 199.99,
      category: 'Electronics',
      imageUrl: 'https://example.com/image.jpg',
      inventory: 50
    };

    it('should create a new product successfully', async () => {
      const createdProduct = {
        id: '123',
        ...validProductData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockProductRepository.search.mockResolvedValue([]); // No existing products
      mockProductRepository.create.mockResolvedValue(createdProduct);

      const token = await getAdminToken();
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProductData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Product created successfully',
        product: createdProduct
      });

      expect(mockProductRepository.search).toHaveBeenCalledWith(validProductData.name);
      expect(mockProductRepository.create).toHaveBeenCalled();
    });

    it('should reject duplicate product names', async () => {
      const existingProduct = {
        id: '456',
        name: 'New Test Product',
        category: 'Electronics'
      };

      mockProductRepository.search.mockResolvedValue([existingProduct]);

      const token = await getAdminToken();
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProductData)
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'A product with this name already exists'
      });
    });

    it('should validate product data', async () => {
      const invalidData = {
        name: '', // Empty name
        price: -10, // Negative price
        inventory: -5 // Negative inventory
      };

      const token = await getAdminToken();
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should require admin role', async () => {
      // Mock customer user
      const customerUser = { id: '123', role: 'customer' };
      mockUserRepository.findById.mockResolvedValue(customerUser);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProductData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PUT /api/products/:id', () => {
    const updateData = {
      name: 'Updated Product Name',
      price: 299.99,
      inventory: 25
    };

    it('should update product successfully', async () => {
      const existingProduct = {
        id: '123',
        name: 'Original Product',
        price: 199.99,
        inventory: 50
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.search.mockResolvedValue([]); // No name conflicts
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const token = await getAdminToken();
      const response = await request(app)
        .put('/api/products/123')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Product updated successfully',
        product: updatedProduct
      });

      expect(mockProductRepository.update).toHaveBeenCalledWith('123', updateData);
    });

    it('should return 404 for non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const token = await getAdminToken();
      const response = await request(app)
        .put('/api/products/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should check for name conflicts when updating name', async () => {
      const existingProduct = {
        id: '123',
        name: 'Original Product'
      };

      const conflictingProduct = {
        id: '456',
        name: 'Updated Product Name'
      };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.search.mockResolvedValue([conflictingProduct]);

      const token = await getAdminToken();
      const response = await request(app)
        .put('/api/products/123')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Product Name' })
        .expect(409);

      expect(response.body.error).toBe('Conflict');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product successfully', async () => {
      const existingProduct = {
        id: '123',
        name: 'Product to Delete'
      };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.delete.mockResolvedValue(true);

      const token = await getAdminToken();
      const response = await request(app)
        .delete('/api/products/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Product deleted successfully',
        deletedProduct: {
          id: '123',
          name: 'Product to Delete'
        }
      });

      expect(mockProductRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should return 404 for non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const token = await getAdminToken();
      const response = await request(app)
        .delete('/api/products/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('PATCH /api/products/:id/inventory', () => {
    it('should set inventory successfully', async () => {
      const existingProduct = {
        id: '123',
        name: 'Test Product',
        inventory: 50
      };

      const updatedProduct = {
        ...existingProduct,
        inventory: 100
      };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/123/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 100, operation: 'set' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Inventory updated successfully',
        product: updatedProduct,
        inventoryChange: {
          operation: 'set',
          quantity: 100,
          previousInventory: 50,
          newInventory: 100
        }
      });
    });

    it('should add to inventory successfully', async () => {
      const existingProduct = {
        id: '123',
        inventory: 50
      };

      const updatedProduct = {
        ...existingProduct,
        inventory: 75
      };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/123/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 25, operation: 'add' })
        .expect(200);

      expect(response.body.inventoryChange.newInventory).toBe(75);
    });

    it('should subtract from inventory successfully', async () => {
      const existingProduct = {
        id: '123',
        inventory: 50
      };

      const updatedProduct = {
        ...existingProduct,
        inventory: 30
      };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/123/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 20, operation: 'subtract' })
        .expect(200);

      expect(response.body.inventoryChange.newInventory).toBe(30);
    });

    it('should reject insufficient inventory for subtraction', async () => {
      const existingProduct = {
        id: '123',
        inventory: 10
      };

      mockProductRepository.findById.mockResolvedValue(existingProduct);

      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/123/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 20, operation: 'subtract' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('Insufficient inventory');
    });

    it('should validate inventory operation', async () => {
      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/123/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 10, operation: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('PATCH /api/products/bulk', () => {
    it('should bulk update products successfully', async () => {
      const productIds = ['123', '456'];
      const updates = { category: 'Updated Category' };

      const product1 = { id: '123', name: 'Product 1', category: 'Updated Category' };
      const product2 = { id: '456', name: 'Product 2', category: 'Updated Category' };

      mockProductRepository.update
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ productIds, updates })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Bulk update completed',
        summary: {
          total: 2,
          successful: 2,
          failed: 0
        }
      });

      expect(response.body.results.successful).toHaveLength(2);
    });

    it('should handle partial failures in bulk update', async () => {
      const productIds = ['123', '456'];
      const updates = { category: 'Updated Category' };

      const product1 = { id: '123', name: 'Product 1', category: 'Updated Category' };

      mockProductRepository.update
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(null); // Product not found

      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ productIds, updates })
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
      const token = await getAdminToken();
      const response = await request(app)
        .patch('/api/products/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ productIds: [], updates: {} }) // Empty arrays
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('DELETE /api/products/bulk', () => {
    it('should bulk delete products successfully', async () => {
      const productIds = ['123', '456'];

      const product1 = { id: '123', name: 'Product 1' };
      const product2 = { id: '456', name: 'Product 2' };

      mockProductRepository.findById
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      mockProductRepository.delete
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const token = await getAdminToken();
      const response = await request(app)
        .delete('/api/products/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ productIds })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Bulk delete completed',
        summary: {
          total: 2,
          successful: 2,
          failed: 0
        }
      });
    });
  });

  describe('POST /api/products/import', () => {
    it('should import products successfully', async () => {
      const products = [
        {
          name: 'Import Product 1',
          description: 'Imported product',
          price: 99.99,
          category: 'Electronics',
          inventory: 10
        },
        {
          name: 'Import Product 2',
          description: 'Another imported product',
          price: 149.99,
          category: 'Electronics',
          inventory: 15
        }
      ];

      const createdProduct1 = { id: '123', ...products[0] };
      const createdProduct2 = { id: '456', ...products[1] };

      mockProductRepository.search.mockResolvedValue([]); // No duplicates
      mockProductRepository.create
        .mockResolvedValueOnce(createdProduct1)
        .mockResolvedValueOnce(createdProduct2);

      const token = await getAdminToken();
      const response = await request(app)
        .post('/api/products/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ products })
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Product import completed',
        summary: {
          total: 2,
          successful: 2,
          failed: 0,
          skipped: 0
        }
      });
    });

    it('should skip duplicates when skipDuplicates is true', async () => {
      const products = [
        {
          name: 'Existing Product',
          description: 'This already exists',
          price: 99.99,
          category: 'Electronics',
          inventory: 10
        }
      ];

      const existingProduct = { id: '123', name: 'Existing Product' };
      mockProductRepository.search.mockResolvedValue([existingProduct]);

      const token = await getAdminToken();
      const response = await request(app)
        .post('/api/products/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ products, skipDuplicates: true })
        .expect(201);

      expect(response.body.summary).toMatchObject({
        total: 1,
        successful: 0,
        failed: 0,
        skipped: 1
      });
    });

    it('should validate import data', async () => {
      const invalidProducts = [
        {
          name: '', // Invalid name
          price: -10 // Invalid price
        }
      ];

      const token = await getAdminToken();
      const response = await request(app)
        .post('/api/products/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: invalidProducts })
        .expect(201);

      expect(response.body.summary.failed).toBe(1);
      expect(response.body.results.failed[0].error).toContain('Validation failed');
    });
  });
});