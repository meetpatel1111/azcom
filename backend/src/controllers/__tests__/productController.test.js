const request = require('supertest');
const app = require('../../app');
const ProductRepository = require('../../repositories/ProductRepository');

// Mock repositories
jest.mock('../../repositories/ProductRepository');

describe('Product Controller', () => {
  let mockProductRepository;

  beforeEach(() => {
    mockProductRepository = {
      findWithFilters: jest.fn(),
      findById: jest.fn(),
      findByCategory: jest.fn(),
      search: jest.fn(),
      getCategories: jest.fn(),
      getProductStats: jest.fn(),
      findLowInventory: jest.fn(),
      hasInventory: jest.fn()
    };

    ProductRepository.mockImplementation(() => mockProductRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should get all products with default pagination', async () => {
      const products = [
        { id: '1', name: 'Product 1', price: 99.99, category: 'Electronics' },
        { id: '2', name: 'Product 2', price: 149.99, category: 'Electronics' }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(products);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toMatchObject({
        products: products,
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        filters: expect.any(Object)
      });

      expect(mockProductRepository.findWithFilters).toHaveBeenCalledTimes(2); // Once for products, once for total count
    });

    it('should filter products by category', async () => {
      const electronicsProducts = [
        { id: '1', name: 'Laptop', price: 999.99, category: 'Electronics' }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(electronicsProducts);

      const response = await request(app)
        .get('/api/products?category=Electronics')
        .expect(200);

      expect(response.body.products).toEqual(electronicsProducts);
      expect(response.body.filters.category).toBe('Electronics');
    });

    it('should filter products by price range', async () => {
      const affordableProducts = [
        { id: '1', name: 'Budget Phone', price: 299.99, category: 'Electronics' }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(affordableProducts);

      const response = await request(app)
        .get('/api/products?minPrice=200&maxPrice=500')
        .expect(200);

      expect(response.body.products).toEqual(affordableProducts);
      expect(response.body.filters.minPrice).toBe('200');
      expect(response.body.filters.maxPrice).toBe('500');
    });

    it('should search products by query', async () => {
      const searchResults = [
        { id: '1', name: 'iPhone 15', price: 999.99, category: 'Electronics' }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/products?search=iPhone')
        .expect(200);

      expect(response.body.products).toEqual(searchResults);
      expect(response.body.filters.search).toBe('iPhone');
    });

    it('should filter in-stock products only', async () => {
      const inStockProducts = [
        { id: '1', name: 'Available Product', price: 99.99, inventory: 10 }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(inStockProducts);

      const response = await request(app)
        .get('/api/products?inStock=true')
        .expect(200);

      expect(response.body.products).toEqual(inStockProducts);
      expect(response.body.filters.inStock).toBe('true');
    });

    it('should sort products by price', async () => {
      const sortedProducts = [
        { id: '1', name: 'Expensive Product', price: 999.99 },
        { id: '2', name: 'Cheap Product', price: 99.99 }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(sortedProducts);

      const response = await request(app)
        .get('/api/products?sortBy=price&sortOrder=desc')
        .expect(200);

      expect(response.body.products).toEqual(sortedProducts);
      expect(response.body.filters.sortBy).toBe('price');
      expect(response.body.filters.sortOrder).toBe('desc');
    });

    it('should handle pagination correctly', async () => {
      const products = [
        { id: '3', name: 'Product 3', price: 199.99 }
      ];

      mockProductRepository.findWithFilters
        .mockResolvedValueOnce(products) // For paginated results
        .mockResolvedValueOnce(Array(25).fill().map((_, i) => ({ id: i + 1 }))); // For total count

      const response = await request(app)
        .get('/api/products?page=2&limit=10')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by ID', async () => {
      const product = {
        id: '123',
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        category: 'Electronics',
        inventory: 10
      };

      mockProductRepository.findById.mockResolvedValue(product);

      const response = await request(app)
        .get('/api/products/123')
        .expect(200);

      expect(response.body).toMatchObject({
        product: product
      });

      expect(mockProductRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return 404 for non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Product not found'
      });
    });
  });

  describe('GET /api/products/category/:category', () => {
    it('should get products by category', async () => {
      const categoryProducts = [
        { id: '1', name: 'Book 1', category: 'Books' },
        { id: '2', name: 'Book 2', category: 'Books' }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(categoryProducts);
      mockProductRepository.findByCategory.mockResolvedValue(categoryProducts);

      const response = await request(app)
        .get('/api/products/category/Books')
        .expect(200);

      expect(response.body).toMatchObject({
        products: categoryProducts,
        category: 'Books',
        pagination: expect.any(Object)
      });
    });
  });

  describe('GET /api/products/search/:query', () => {
    it('should search products by query', async () => {
      const searchResults = [
        { id: '1', name: 'Gaming Laptop', category: 'Electronics' }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(searchResults);
      mockProductRepository.search.mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/products/search/gaming')
        .expect(200);

      expect(response.body).toMatchObject({
        products: searchResults,
        query: 'gaming',
        pagination: expect.any(Object)
      });
    });

    it('should validate search query length', async () => {
      const response = await request(app)
        .get('/api/products/search/a') // Too short
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/products/categories', () => {
    it('should get all categories', async () => {
      const categories = ['Electronics', 'Books', 'Clothing', 'Home & Garden'];

      mockProductRepository.getCategories.mockResolvedValue(categories);

      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body).toMatchObject({
        categories: categories
      });
    });
  });

  describe('GET /api/products/stats', () => {
    it('should get product statistics', async () => {
      const stats = {
        totalProducts: 100,
        totalCategories: 6,
        averagePrice: 299.99,
        totalInventory: 1500,
        outOfStock: 5,
        lowInventory: 12
      };

      mockProductRepository.getProductStats.mockResolvedValue(stats);

      const response = await request(app)
        .get('/api/products/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        stats: stats
      });
    });
  });

  describe('GET /api/products/low-inventory', () => {
    it('should get products with low inventory', async () => {
      const lowInventoryProducts = [
        { id: '1', name: 'Almost Out', inventory: 3 },
        { id: '2', name: 'Running Low', inventory: 7 }
      ];

      mockProductRepository.findLowInventory.mockResolvedValue(lowInventoryProducts);

      const response = await request(app)
        .get('/api/products/low-inventory?threshold=10')
        .expect(200);

      expect(response.body).toMatchObject({
        products: lowInventoryProducts,
        threshold: 10,
        count: 2
      });

      expect(mockProductRepository.findLowInventory).toHaveBeenCalledWith(10);
    });

    it('should use default threshold', async () => {
      mockProductRepository.findLowInventory.mockResolvedValue([]);

      await request(app)
        .get('/api/products/low-inventory')
        .expect(200);

      expect(mockProductRepository.findLowInventory).toHaveBeenCalledWith(10);
    });
  });

  describe('GET /api/products/:id/availability', () => {
    it('should check product availability', async () => {
      const product = {
        id: '123',
        name: 'Test Product',
        inventory: 15
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/products/123/availability?quantity=5')
        .expect(200);

      expect(response.body).toMatchObject({
        productId: '123',
        productName: 'Test Product',
        requestedQuantity: 5,
        availableQuantity: 15,
        available: true,
        inStock: true
      });

      expect(mockProductRepository.hasInventory).toHaveBeenCalledWith('123', 5);
    });

    it('should handle insufficient inventory', async () => {
      const product = {
        id: '123',
        name: 'Test Product',
        inventory: 2
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.hasInventory.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/products/123/availability?quantity=5')
        .expect(200);

      expect(response.body).toMatchObject({
        available: false,
        availableQuantity: 2,
        requestedQuantity: 5
      });
    });

    it('should return 404 for non-existent product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/nonexistent/availability')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('GET /api/products/featured', () => {
    it('should get featured products', async () => {
      const featuredProducts = [
        { id: '1', name: 'Featured Product 1', inventory: 10 },
        { id: '2', name: 'Featured Product 2', inventory: 5 }
      ];

      mockProductRepository.findWithFilters.mockResolvedValue(featuredProducts);

      const response = await request(app)
        .get('/api/products/featured?limit=8')
        .expect(200);

      expect(response.body).toMatchObject({
        products: featuredProducts,
        count: 2
      });
    });
  });
});