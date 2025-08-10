import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { CartProvider } from '../../../context/CartContext';
import { AuthProvider } from '../../../context/AuthContext';
import { Product } from '../../../types';

// Mock the cart and auth services
const mockCartService = {
  addToCart: vi.fn(),
  getCart: vi.fn(),
};

const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
};

vi.mock('../../../services/cartService', () => mockCartService);
vi.mock('../../../services/authService', () => mockAuthService);

const mockProduct: Product = {
  id: 'product-1',
  name: 'Test Product',
  description: 'Test description',
  price: 29.99,
  category: 'Electronics',
  imageUrl: '/test-image.jpg',
  inventory: 10,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer' as const,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const renderWithProviders = (component: React.ReactElement, { isAuthenticated = false } = {}) => {
  const mockAuthContextValue = {
    user: isAuthenticated ? mockUser : null,
    isAuthenticated,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    clearError: vi.fn(),
  };

  const mockCartContextValue = {
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
    fetchCart: vi.fn(),
    addToCart: mockCartService.addToCart,
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    syncCart: vi.fn(),
    clearError: vi.fn(),
    getItemQuantity: vi.fn().mockReturnValue(0),
    isInCart: vi.fn().mockReturnValue(false),
  };

  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContextValue}>
        <CartProvider value={mockCartContextValue}>
          {component}
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProductCard Cart Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  it('shows login alert when not authenticated and add to cart is clicked', async () => {
    renderWithProviders(<ProductCard product={mockProduct} />, { isAuthenticated: false });

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(window.alert).toHaveBeenCalledWith('Please log in to add items to your cart');
    expect(mockCartService.addToCart).not.toHaveBeenCalled();
  });

  it('adds product to cart when authenticated and add to cart is clicked', async () => {
    mockCartService.addToCart.mockResolvedValue({
      cart: { id: 'cart-1', userId: 'user-1', items: [], createdAt: '', updatedAt: '' },
      itemCount: 1,
      uniqueItems: 1,
      subtotal: 29.99,
      total: 29.99,
    });

    renderWithProviders(<ProductCard product={mockProduct} />, { isAuthenticated: true });

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockCartService.addToCart).toHaveBeenCalledWith('product-1', 1);
    });
  });

  it('shows loading state while adding to cart', async () => {
    let resolveAddToCart: (value: any) => void;
    const addToCartPromise = new Promise((resolve) => {
      resolveAddToCart = resolve;
    });
    mockCartService.addToCart.mockReturnValue(addToCartPromise);

    renderWithProviders(<ProductCard product={mockProduct} />, { isAuthenticated: true });

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    // Should show loading state
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(addToCartButton).toBeDisabled();

    // Resolve the promise
    resolveAddToCart!({
      cart: { id: 'cart-1', userId: 'user-1', items: [], createdAt: '', updatedAt: '' },
      itemCount: 1,
      uniqueItems: 1,
      subtotal: 29.99,
      total: 29.99,
    });

    await waitFor(() => {
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      expect(addToCartButton).not.toBeDisabled();
    });
  });

  it('handles add to cart error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCartService.addToCart.mockRejectedValue(new Error('Add to cart failed'));

    renderWithProviders(<ProductCard product={mockProduct} />, { isAuthenticated: true });

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add to cart:', expect.any(Error));
    });

    // Button should be enabled again after error
    expect(addToCartButton).not.toBeDisabled();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('disables add to cart button when product is out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inventory: 0 };
    renderWithProviders(<ProductCard product={outOfStockProduct} />, { isAuthenticated: true });

    const addToCartButton = screen.getByText('Out of Stock');
    expect(addToCartButton).toBeDisabled();
  });

  it('uses custom onAddToCart when provided', async () => {
    const mockOnAddToCart = vi.fn();
    renderWithProviders(
      <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />,
      { isAuthenticated: true }
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith('product-1');
    expect(mockCartService.addToCart).not.toHaveBeenCalled();
  });
});