const ProductRepository = require('../ProductRepository');

// Mock the base repository
jest.mock('../BaseRepository');
const BaseRepository = require('../BaseRepository');

describe('ProductRepository', () => {
  let productRepository;
  let mockBaseRepository;

  beforeEach(() => {
    mockBaseRepository = {
      findAll: jest.fn(),
      findWhere: jest.fn(),
      findById: jest.fn(),
      update: jest.fn()
    };

    BaseRepository.mockImplementation(() => mockBaseRepository);
    productRepository = new ProductRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByCategory', () => {
    it('should find products by category (case insensitive)', async () => {
      const products = [
        { id: '1', name: 'Laptop', category: 'Electronics' },
        { id: '2', name: 'Shirt', category: 'Clothing' },
        { id: '3', name: 'Phone', category: 'Electronics' }
      ];

      mockBaseRepository.findWhere.mockImplementation((predicate) => 
        products.filter(predicate)
      );

      const result = await productRepository.findByCategory('electronics');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Laptop');
      expect(result[1].name).toBe('Phone');
    });
  });

  describe('search', () => {
    it('should search products by name and description', async () => {
      const products = [
        { id: '1', name: 'Gaming Laptop', description: 'High performance laptop' },
        { id: '2', name: 'Office Chair', description: 'Comfortable gaming chair' },
        { id: '3', name: 'Smartphone', description: 'Latest mobile phone' }
      ];

      mockBaseRepository.findWhere.mockImplementation((predicate) => 
        products.filter(predicate)
      );

      const result = await productRepository.search('gaming');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Gaming Laptop');
      expect(result[1].name).toBe('Office Chair');
    });
  });

  describe('findWithFilters', () => {
    const products = [
      { id: '1', name: 'Laptop', category: 'Electronics', price: 1000, inventory: 5 },
      { id: '2', name: 'Phone', category: 'Electronics', price: 500, inventory: 0 },
      { id: '3', name: 'Shirt', category: 'Clothing', price: 50, inventory: 10 }
    ];

    beforeEach(() => {
      mockBaseRepository.findAll.mockResolvedValue(products);
    });

    it('should filter by category', async () => {
      const result = await productRepository.findWithFilters({ category: 'Electronics' });

      expect(result).toHaveLength(2);
      expect(result.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should filter by price range', async () => {
      const result = await productRepository.findWithFilters({ 
        minPrice: 100, 
        maxPrice: 800 
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Phone');
    });

    it('should filter by stock availability', async () => {
      const result = await productRepository.findWithFilters({ inStock: true });

      expect(result).toHaveLength(2);
      expect(result.every(p => p.inventory > 0)).toBe(true);
    });

    it('should sort products', async () => {
      const result = await productRepository.findWithFilters({ 
        sortBy: 'price', 
        sortOrder: 'desc' 
      });

      expect(result[0].price).toBe(1000);
      expect(result[1].price).toBe(500);
      expect(result[2].price).toBe(50);
    });

    it('should apply pagination', async () => {
      const result = await productRepository.findWithFilters({ 
        limit: 2, 
        offset: 1 
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });
  });

  describe('updateInventory', () => {
    it('should update product inventory', async () => {
      const product = { id: '1', name: 'Laptop', inventory: 10 };
      const updatedProduct = { ...product, inventory: 8 };

      mockBaseRepository.findById.mockResolvedValue(product);
      mockBaseRepository.update.mockResolvedValue(updatedProduct);

      const result = await productRepository.updateInventory('1', -2);

      expect(result).toEqual(updatedProduct);
      expect(mockBaseRepository.update).toHaveBeenCalledWith('1', { inventory: 8 });
    });

    it('should throw error for insufficient inventory', async () => {
      const product = { id: '1', name: 'Laptop', inventory: 2 };
      mockBaseRepository.findById.mockResolvedValue(product);

      await expect(productRepository.updateInventory('1', -5))
        .rejects.toThrow('Insufficient inventory');
    });

    it('should return null for non-existent product', async () => {
      mockBaseRepository.findById.mockResolvedValue(null);

      const result = await productRepository.updateInventory('nonexistent', -1);

      expect(result).toBeNull();
    });
  });

  describe('hasInventory', () => {
    it('should return true for sufficient inventory', async () => {
      const product = { id: '1', inventory: 10 };
      mockBaseRepository.findById.mockResolvedValue(product);

      const result = await productRepository.hasInventory('1', 5);

      expect(result).toBe(true);
    });

    it('should return false for insufficient inventory', async () => {
      const product = { id: '1', inventory: 2 };
      mockBaseRepository.findById.mockResolvedValue(product);

      const result = await productRepository.hasInventory('1', 5);

      expect(result).toBe(false);
    });

    it('should return false for non-existent product', async () => {
      mockBaseRepository.findById.mockResolvedValue(null);

      const result = await productRepository.hasInventory('nonexistent', 1);

      expect(result).toBe(false);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories sorted', async () => {
      const products = [
        { category: 'Electronics' },
        { category: 'Clothing' },
        { category: 'Electronics' },
        { category: 'Books' },
        { category: null }
      ];

      mockBaseRepository.findAll.mockResolvedValue(products);

      const result = await productRepository.getCategories();

      expect(result).toEqual(['Books', 'Clothing', 'Electronics']);
    });
  });

  describe('getProductStats', () => {
    it('should calculate product statistics', async () => {
      const products = [
        { price: 100, inventory: 0 },
        { price: 200, inventory: 5 },
        { price: 300, inventory: 15 }
      ];

      mockBaseRepository.findAll.mockResolvedValue(products);
      productRepository.getCategories = jest.fn().mockResolvedValue(['Electronics', 'Clothing']);

      const result = await productRepository.getProductStats();

      expect(result).toEqual({
        totalProducts: 3,
        totalCategories: 2,
        averagePrice: 200,
        totalInventory: 20,
        outOfStock: 1,
        lowInventory: 1
      });
    });

    it('should handle empty product list', async () => {
      mockBaseRepository.findAll.mockResolvedValue([]);
      productRepository.getCategories = jest.fn().mockResolvedValue([]);

      const result = await productRepository.getProductStats();

      expect(result).toEqual({
        totalProducts: 0,
        totalCategories: 0,
        averagePrice: 0,
        totalInventory: 0,
        outOfStock: 0,
        lowInventory: 0
      });
    });
  });
});