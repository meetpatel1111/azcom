import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface UseAddToCartReturn {
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  isAdding: boolean;
  error: string | null;
  clearError: () => void;
}

export const useAddToCart = (): UseAddToCartReturn => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart: addToCartContext } = useCart();
  const { isAuthenticated } = useAuth();

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your cart');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      await addToCartContext(productId, quantity);
    } catch (err: any) {
      setError(err.message || 'Failed to add item to cart');
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    addToCart,
    isAdding,
    error,
    clearError,
  };
};