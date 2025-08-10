const {
  validateAddToCart,
  validateUpdateCartItem,
  validateCreateCart,
  createCart,
  createCartItem,
  calculateCartTotals,
  sanitizeCart,
  isCartEmpty,
  findCartItem,
  getCartItemQuantity
} = require('../Cart');

describe('Cart Model', () => {
  describe('validateAddToCart', () => {
    it('should validate valid add to cart data', () => {
      const cartData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2
      };

      const { error, value } = validateAddToCart(cartData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(cartData);
    });

    it('should set default quantity to 1', () => {
      const cartData = {
        productId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const { error, value } = validateAddToCart(cartData);
      
      expect(error).toBeUndefined();
      expect(value.quantity).toBe(1);
    });

    it('should require valid UUID for productId', () => {
      const { error } = validateAddToCart({ productId: 'invalid-uuid' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Product ID must be a valid UUID');
    });

    it('should require positive quantity', () => {
      const { error } = validateAddToCart({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 0
      });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Quantity must be at least 1');
    });

    it('should limit maximum quantity', () => {
      const { error } = validateAddToCart({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1000
      });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Quantity cannot exceed 999');
    });
  });

  describe('validateUpdateCartItem', () => {
    it('should validate quantity update', () => {
      const { error, value } = validateUpdateCartItem({ quantity: 5 });
      
      expect(error).toBeUndefined();
      expect(value.quantity).toBe(5);
    });

    it('should allow zero quantity (for removal)', () => {
      const { error } = validateUpdateCartItem({ quantity: 0 });
      
      expect(error).toBeUndefined();
    });

    it('should require quantity', () => {
      const { error } = validateUpdateCartItem({});
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Quantity is required');
    });
  });

  describe('validateCreateCart', () => {
    it('should validate cart creation data', () => {
      const cartData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        items: []
      };

      const { error, value } = validateCreateCart(cartData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(cartData);
    });

    it('should set default empty items array', () => {
      const cartData = {
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const { error, value } = validateCreateCart(cartData);
      
      expect(error).toBeUndefined();
      expect(value.items).toEqual([]);
    });

    it('should require valid UUID for userId', () => {
      const { error } = validateCreateCart({ userId: 'invalid-uuid' });
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('User ID must be a valid UUID');
    });
  });

  describe('createCart', () => {
    it('should create cart with all fields', () => {
      const cartData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        items: [{ productId: '456', quantity: 2 }]
      };

      const cart = createCart(cartData);

      expect(cart).toEqual(cartData);
    });

    it('should set empty items array if not provided', () => {
      const cartData = {
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const cart = createCart(cartData);

      expect(cart.items).toEqual([]);
    });
  });

  describe('createCartItem', () => {
    it('should create cart item with timestamp', () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const quantity = 3;

      const item = createCartItem(productId, quantity);

      expect(item).toEqual({
        productId,
        quantity,
        addedAt: expect.any(String)
      });
      expect(new Date(item.addedAt)).toBeInstanceOf(Date);
    });

    it('should set default quantity to 1', () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      const item = createCartItem(productId);

      expect(item.quantity).toBe(1);
    });
  });

  describe('calculateCartTotals', () => {
    it('should calculate totals for cart with products', () => {
      const cart = {
        items: [
          { quantity: 2, product: { price: 10.50 } },
          { quantity: 1, product: { price: 25.99 } }
        ]
      };

      const totals = calculateCartTotals(cart);

      expect(totals).toEqual({
        itemCount: 3,
        uniqueItems: 2,
        subtotal: 46.99,
        total: 46.99
      });
    });

    it('should handle empty cart', () => {
      const totals = calculateCartTotals(null);

      expect(totals).toEqual({
        itemCount: 0,
        uniqueItems: 0,
        subtotal: 0,
        total: 0
      });
    });

    it('should handle items without products', () => {
      const cart = {
        items: [
          { quantity: 2, product: null },
          { quantity: 1, product: { price: 10.00 } }
        ]
      };

      const totals = calculateCartTotals(cart);

      expect(totals).toEqual({
        itemCount: 3,
        uniqueItems: 2,
        subtotal: 10.00,
        total: 10.00
      });
    });
  });

  describe('sanitizeCart', () => {
    it('should return cart fields without sensitive data', () => {
      const cart = {
        id: '123',
        userId: '456',
        items: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        extraField: 'should not appear'
      };

      const sanitized = sanitizeCart(cart);

      expect(sanitized).toEqual({
        id: '123',
        userId: '456',
        items: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      });
    });
  });

  describe('isCartEmpty', () => {
    it('should return true for empty cart', () => {
      const cart = { items: [] };
      
      expect(isCartEmpty(cart)).toBe(true);
    });

    it('should return true for null cart', () => {
      expect(isCartEmpty(null)).toBe(true);
    });

    it('should return false for cart with items', () => {
      const cart = { items: [{ productId: '123', quantity: 1 }] };
      
      expect(isCartEmpty(cart)).toBe(false);
    });
  });

  describe('findCartItem', () => {
    const cart = {
      items: [
        { productId: '123', quantity: 2 },
        { productId: '456', quantity: 1 }
      ]
    };

    it('should find existing cart item', () => {
      const item = findCartItem(cart, '123');
      
      expect(item).toEqual({ productId: '123', quantity: 2 });
    });

    it('should return null for non-existing item', () => {
      const item = findCartItem(cart, '999');
      
      expect(item).toBeNull();
    });

    it('should handle null cart', () => {
      const item = findCartItem(null, '123');
      
      expect(item).toBeNull();
    });
  });

  describe('getCartItemQuantity', () => {
    const cart = {
      items: [
        { productId: '123', quantity: 5 }
      ]
    };

    it('should return quantity for existing item', () => {
      const quantity = getCartItemQuantity(cart, '123');
      
      expect(quantity).toBe(5);
    });

    it('should return 0 for non-existing item', () => {
      const quantity = getCartItemQuantity(cart, '999');
      
      expect(quantity).toBe(0);
    });
  });
});