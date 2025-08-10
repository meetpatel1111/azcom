import { apiClient, handleApiError } from './api';
import { Cart, CartSummary } from '../types';
import { AxiosError } from 'axios';

interface CartResponse {
  cart: Cart;
  itemCount: number;
  uniqueItems: number;
  subtotal: number;
  total: number;
}

interface AddToCartResponse extends CartResponse {
  message: string;
  addedItem: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  };
}

interface UpdateCartResponse extends CartResponse {
  message: string;
  updatedItem?: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  };
  removedItem?: {
    productId: string;
    productName: string;
  };
}

interface CartSummaryResponse extends CartSummary {}

interface CartCountResponse {
  count: number;
  uniqueItems: number;
}

interface SyncCartResponse extends CartResponse {
  message: string;
  changes: {
    removedItems: Array<{
      productId: string;
      productName?: string;
      reason: string;
    }>;
    updatedItems: Array<{
      productId: string;
      productName: string;
      previousQuantity: number;
      newQuantity: number;
      reason: string;
    }>;
  };
  summary: {
    itemsRemoved: number;
    itemsUpdated: number;
    totalChanges: number;
  };
}

export const getCart = async (): Promise<CartResponse> => {
  try {
    return await apiClient.get<CartResponse>('/cart');
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const addToCart = async (productId: string, quantity: number = 1): Promise<AddToCartResponse> => {
  try {
    return await apiClient.post<AddToCartResponse>('/cart/items', {
      productId,
      quantity,
    });
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const updateCartItem = async (productId: string, quantity: number): Promise<UpdateCartResponse> => {
  try {
    return await apiClient.put<UpdateCartResponse>(`/cart/items/${productId}`, {
      quantity,
    });
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const removeFromCart = async (productId: string): Promise<UpdateCartResponse> => {
  try {
    return await apiClient.delete<UpdateCartResponse>(`/cart/items/${productId}`);
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const getCartSummary = async (): Promise<CartSummaryResponse> => {
  try {
    return await apiClient.get<CartSummaryResponse>('/cart/summary');
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const getCartCount = async (): Promise<CartCountResponse> => {
  try {
    return await apiClient.get<CartCountResponse>('/cart/count');
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const clearCart = async (): Promise<{ message: string; cart: Cart }> => {
  try {
    return await apiClient.delete('/cart');
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const syncCart = async (): Promise<SyncCartResponse> => {
  try {
    return await apiClient.post<SyncCartResponse>('/cart/sync');
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const validateCart = async (): Promise<{
  valid: boolean;
  errors: Array<{
    productId: string;
    productName?: string;
    error: string;
    requested?: number;
    available?: number;
  }>;
  validItems: Array<{
    productId: string;
    quantity: number;
  }>;
  summary: {
    totalItems: number;
    validItems: number;
    invalidItems: number;
  };
}> => {
  try {
    return await apiClient.get('/cart/validate');
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};