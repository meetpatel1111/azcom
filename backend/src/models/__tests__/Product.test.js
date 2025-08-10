const {
  validateCreateProduct,
  validateUpdateProduct,
  createProduct,
  sanitizeProduct
} = require('../Product');

describe('Product Model', () => {
  describe('validateCreateProduct', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'A test product description',
      price: 99.99,
      category: 'Electronics',
      imageUrl: 'https://example.com/image.jpg',
      inventory: 10
    };

    it('should validate valid product data', () => {
      const { error, value } = validateCreateProduct(validProductData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validProductData);
    });

    it('should require name', () => {
      const { error } = validateCreateProduct({ ...validProductData, name: '' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Product name is required');
    });

    it('should require description', () => {
      const { error } = validateCreateProduct({ ...validProductData, description: '' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Product description is required');
    });

    it('should require positive price', () => {
      const { error } = validateCreateProduct({ ...validProductData, price: -10 });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Price must be positive');
    });

    it('should require non-negative inventory', () => {
      const { error } = validateCreateProduct({ ...validProductData, inventory: -1 });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Inventory cannot be negative');
    });

    it('should validate URL format for imageUrl', () => {
      const { error } = validateCreateProduct({ ...validProductData, imageUrl: 'not-a-url' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Image URL must be a valid URL');
    });

    it('should allow empty imageUrl', () => {
      const { error } = validateCreateProduct({ ...validProductData, imageUrl: '' });
      
      expect(error).toBeUndefined();
    });

    it('should limit name length', () => {
      const longName = 'a'.repeat(201);
      const { error } = validateCreateProduct({ ...validProductData, name: longName });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Product name cannot exceed 200 characters');
    });
  });

  describe('validateUpdateProduct', () => {
    it('should validate partial update data', () => {
      const updateData = { name: 'Updated Product', price: 149.99 };
      const { error, value } = validateUpdateProduct(updateData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });

    it('should allow empty update', () => {
      const { error } = validateUpdateProduct({});
      
      expect(error).toBeUndefined();
    });

    it('should validate price if provided', () => {
      const { error } = validateUpdateProduct({ price: -10 });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Price must be positive');
    });
  });

  describe('createProduct', () => {
    it('should create product with all fields', () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Electronics',
        imageUrl: 'https://example.com/image.jpg',
        inventory: 10
      };

      const product = createProduct(productData);

      expect(product).toEqual(productData);
    });

    it('should set empty imageUrl if not provided', () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Electronics',
        inventory: 10
      };

      const product = createProduct(productData);

      expect(product.imageUrl).toBe('');
    });
  });

  describe('sanitizeProduct', () => {
    it('should return all product fields', () => {
      const product = {
        id: '123',
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Electronics',
        imageUrl: 'https://example.com/image.jpg',
        inventory: 10,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        extraField: 'should not appear'
      };

      const sanitized = sanitizeProduct(product);

      expect(sanitized).toEqual({
        id: '123',
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Electronics',
        imageUrl: 'https://example.com/image.jpg',
        inventory: 10,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      });
    });
  });
});