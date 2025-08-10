import { Cart, CartSummary, CartItem } from '../types';
import { getMockProductById } from '../data/mockData';

// Simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock cart storage (in real app, this would be in backend)
let mockCart: Cart | null = null;

interface CartResponse {
  cart: Cart;
  itemCount: number;
  uniqueItems: number;
  subtotal: number;
  total: number;
}

const calculateCartTotals = (cart: Cart) => {
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = cart.items.length;
  const subtotal = cart.items.reduce((sum, item) => {
    const product = item.product;
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  
  return {
    itemCount,
    uniqueItems,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100,
  };
};

const populateCartWithProducts = (cart: Cart): Cart => {
  return {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      product: getMockProductById(item.productId),
    })),
  };
};

export const mockCartService = {
  getCart: async (): Promise<CartResponse> => {
    await delay(200);
    
    if (!mockCart) {
      mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    const cartWithProducts = populateCartWithProducts(mockCart);
    const totals = calculateCartTotals(cartWithProducts);
    
    return {
      cart: cartWithProducts,
      ...totals,
    };
  },

  addToCart: async (productId: string, quantity: number = 1): Promise<CartResponse> => {
    await delay(400);
    
    const product = getMockProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.inventory < quantity) {
      throw new Error(`Insufficient inventory. Only ${product.inventory} items available.`);
    }
    
    if (!mockCart) {
      mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    const existingItemIndex = mockCart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      mockCart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      mockCart.items.push({
        productId,
        quantity,
        addedAt: new Date().toISOString(),
        product,
      });
    }
    
    mockCart.updatedAt = new Date().toISOString();
    
    const cartWithProducts = populateCartWithProducts(mockCart);
    const totals = calculateCartTotals(cartWithProducts);
    
    return {
      cart: cartWithProducts,
      ...totals,
    };
  },

  updateCartItem: async (productId: string, quantity: number): Promise<CartResponse> => {
    await delay(300);
    
    if (!mockCart) {
      throw new Error('Cart not found');
    }
    
    const itemIndex = mockCart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }
    
    if (quantity <= 0) {
      // Remove item
      mockCart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      const product = getMockProductById(productId);
      if (product && product.inventory < quantity) {
        throw new Error(`Insufficient inventory. Only ${product.inventory} items available.`);
      }
      
      mockCart.items[itemIndex].quantity = quantity;
    }
    
    mockCart.updatedAt = new Date().toISOString();
    
    const cartWithProducts = populateCartWithProducts(mockCart);
    const totals = calculateCartTotals(cartWithProducts);
    
    return {
      cart: cartWithProducts,
      ...totals,
    };
  },

  removeFromCart: async (productId: string): Promise<CartResponse> => {
    await delay(250);
    
    if (!mockCart) {
      throw new Error('Cart not found');
    }
    
    const itemIndex = mockCart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }
    
    mockCart.items.splice(itemIndex, 1);
    mockCart.updatedAt = new Date().toISOString();
    
    const cartWithProducts = populateCartWithProducts(mockCart);
    const totals = calculateCartTotals(cartWithProducts);
    
    return {
      cart: cartWithProducts,
      ...totals,
    };
  },

  clearCart: async (): Promise<{ message: string; cart: Cart }> => {
    await delay(200);
    
    if (!mockCart) {
      mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      mockCart.items = [];
      mockCart.updatedAt = new Date().toISOString();
    }
    
    return {
      message: 'Cart cleared successfully',
      cart: mockCart,
    };
  },

  getCartSummary: async (): Promise<CartSummary> => {
    await delay(150);
    
    if (!mockCart || mockCart.items.length === 0) {
      return {
        itemCount: 0,
        uniqueItems: 0,
        subtotal: 0,
        total: 0,
        isEmpty: true,
      };
    }
    
    const cartWithProducts = populateCartWithProducts(mockCart);
    const totals = calculateCartTotals(cartWithProducts);
    
    return {
      ...totals,
      isEmpty: totals.itemCount === 0,
    };
  },

  syncCart: async (): Promise<CartResponse> => {
    await delay(300);
    
    if (!mockCart) {
      throw new Error('Cart not found');
    }
    
    // Remove items that are no longer available or out of stock
    mockCart.items = mockCart.items.filter(item => {
      const product = getMockProductById(item.productId);
      return product && product.inventory > 0;
    });
    
    // Adjust quantities for items with insufficient inventory
    mockCart.items = mockCart.items.map(item => {
      const product = getMockProductById(item.productId);
      if (product && product.inventory < item.quantity) {
        return {
          ...item,
          quantity: product.inventory,
        };
      }
      return item;
    });
    
    mockCart.updatedAt = new Date().toISOString();
    
    const cartWithProducts = populateCartWithProducts(mockCart);
    const totals = calculateCartTotals(cartWithProducts);
    
    return {
      cart: cartWithProducts,
      ...totals,
    };
  },
};