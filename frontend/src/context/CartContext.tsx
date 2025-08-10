import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Cart, CartItem, CartSummary, Product } from '../types';
import { useAuth } from './AuthContext';
import { mockCartService } from '../services/mockCartService';

// Cart State
interface CartState {
  cart: Cart | null;
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;
}

// Cart Actions
type CartAction =
  | { type: 'CART_LOADING' }
  | { type: 'CART_SUCCESS'; payload: { cart: Cart; summary: CartSummary } }
  | { type: 'CART_ERROR'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_ITEM_COUNT'; payload: number };

// Initial state
const initialState: CartState = {
  cart: null,
  summary: {
    itemCount: 0,
    uniqueItems: 0,
    subtotal: 0,
    total: 0,
    isEmpty: true,
  },
  isLoading: false,
  error: null,
};

// Cart reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'CART_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'CART_SUCCESS':
      return {
        ...state,
        cart: action.payload.cart,
        summary: action.payload.summary,
        isLoading: false,
        error: null,
      };

    case 'CART_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'CLEAR_CART':
      return {
        ...state,
        cart: null,
        summary: initialState.summary,
        isLoading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_ITEM_COUNT':
      return {
        ...state,
        summary: {
          ...state.summary,
          itemCount: action.payload,
        },
      };

    default:
      return state;
  }
};

// Cart Context
interface CartContextType extends CartState {
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  clearError: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Fetch cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated, user]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'CART_LOADING' });
      const cartData = await mockCartService.getCart();
      
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          cart: cartData.cart,
          summary: {
            itemCount: cartData.itemCount,
            uniqueItems: cartData.uniqueItems,
            subtotal: cartData.subtotal,
            total: cartData.total,
            isEmpty: cartData.itemCount === 0,
          },
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.message || 'Failed to fetch cart',
      });
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to cart');
    }

    try {
      dispatch({ type: 'CART_LOADING' });
      const response = await mockCartService.addToCart(productId, quantity);
      
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          cart: response.cart,
          summary: {
            itemCount: response.itemCount,
            uniqueItems: response.uniqueItems,
            subtotal: response.subtotal,
            total: response.total,
            isEmpty: response.itemCount === 0,
          },
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.message || 'Failed to add item to cart',
      });
      throw error;
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'CART_LOADING' });
      const response = await mockCartService.updateCartItem(productId, quantity);
      
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          cart: response.cart,
          summary: {
            itemCount: response.itemCount,
            uniqueItems: response.uniqueItems,
            subtotal: response.subtotal,
            total: response.total,
            isEmpty: response.itemCount === 0,
          },
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.message || 'Failed to update cart item',
      });
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'CART_LOADING' });
      const response = await mockCartService.removeFromCart(productId);
      
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          cart: response.cart,
          summary: {
            itemCount: response.itemCount,
            uniqueItems: response.uniqueItems,
            subtotal: response.subtotal,
            total: response.total,
            isEmpty: response.itemCount === 0,
          },
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.message || 'Failed to remove item from cart',
      });
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'CART_LOADING' });
      await mockCartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.message || 'Failed to clear cart',
      });
      throw error;
    }
  };

  const syncCart = async () => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'CART_LOADING' });
      const response = await mockCartService.syncCart();
      
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          cart: response.cart,
          summary: {
            itemCount: response.itemCount,
            uniqueItems: response.uniqueItems,
            subtotal: response.subtotal,
            total: response.total,
            isEmpty: response.itemCount === 0,
          },
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.message || 'Failed to sync cart',
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const getItemQuantity = (productId: string): number => {
    if (!state.cart) return 0;
    const item = state.cart.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId: string): boolean => {
    return getItemQuantity(productId) > 0;
  };

  const contextValue: CartContextType = {
    ...state,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncCart,
    clearError,
    getItemQuantity,
    isInCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};