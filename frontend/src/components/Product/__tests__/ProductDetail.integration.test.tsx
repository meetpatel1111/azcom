import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProductDetail from '../ProductDetail';
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

const renderWithProviders = (component: React.ReactElement, { isAuthenticated = false, inCart = false, itemQuantity = 0 } = {}) => {
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
      itemCount: itemQuantity,
      uniqueItems: inCart ? 1 : 0,
      subtotal: itemQuantity * mockProduct.price,
      total: itemQuantity * mockProduct.price,
      isEmpty: itemQuantity === 0,
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
    getItemQuantity: vi.fn().mockReturnValue(itemQuantity),
    isInCart: vi.fn().mockReturnValue(inCart),
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

describe('ProductDetail Cart Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  it('shows login alert when not authenticated and add to cart is clicked', async () => {
    renderWithProviders(<ProductDetail product={mockProduct} />, { isAuthenticated: false });

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(window.alert).toHaveBeenCalledWith('Please log in to add items to your cart');
    expect(mockCartService.addToCart).not.toHaveBeenCalled();
  });

  it('adds product to cart with selected quantity when authenticated', async () => {
    mockCartService.addToCart.mockResolvedValue({
      cart: { id: 'cart-1', userId: 'user-1', items: [], createdAt: '', updatedAt: '' },
      itemCount: 2,
      uniqueItems: 1,
      subtotal: 59.98,
      total: 59.98,
    });

    renderWithProviders(<ProductDetail product={mockProduct} />, { isAuthenticated: true });

    // Increase quantity to 2
    const increaseButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseButton);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockCartService.addToCart).toHaveBeenCalledWith('product-1', 2);
    });
  });

  it('shows current cart status when product is in cart', () => {
    renderWithProviders(<ProductDetail product={mockProduct} />, { 
      isAuthenticated: true, 
      inCart: true, 
      itemQuantity: 3 
    });

    expect(screen.getByText('3 items in your cart')).toBeInTheDocument();
    expect(screen.getByText('Add More to Cart')).toBeInTheDocument();
  });

  it('resets quantity to 1 after successful add to cart', async () => {
    mockCartService.addToCart.mockResolvedValue({
      cart: { id: 'cart-1', userId: 'user-1', items: [], createdAt: '', updatedAt: '' },
      itemCount: 3,
      uniqueItems: 1,
      subtotal: 89.97,
      total: 89.97,
    });

    renderWithProviders(<ProductDetail product={mockProduct} />, { isAuthenticated: true });

    // Increase quantity to 3
    const increaseButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    // Verify quantity is 3
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockCartService.addToCart).toHaveBeenCalledWith('product-1', 3);
    });

    // Quantity should reset to 1 after successful add
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });
  });

  it('shows loading state while adding to cart', async () => {
    let resolveAddToCart: (value: any) => void;
    const addToCartPromise = new Promise((resolve) => {
      resolveAddToCart = resolve;
    });
    mockCartService.addToCart.mockReturnValue(addToCartPromise);

    renderWithProviders(<ProductDetail product={mockProduct} />, { isAuthenticated: true });

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    // Should show loading state
    expect(screen.getByText('Adding to Cart...')).toBeInTheDocument();
    expect(addToCartButton).toBeDisabled();

    // Quantity selector should be disabled
    const increaseButton = screen.getByLabelText('Increase quantity');
    expect(increaseButton).toBeDisabled();

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

    renderWithProviders(<ProductDetail product={mockProduct} />, { isAuthenticated: true });

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

  it('does not show add to cart section when product is out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inventory: 0 };
    renderWithProviders(<ProductDetail product={outOfStockProduct} />, { isAuthenticated: true });

    expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Quantity:')).not.toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('limits quantity selector to available inventory', () => {
    const lowStockProduct = { ...mockProduct, inventory: 3 };
    renderWithProviders(<ProductDetail product={lowStockProduct} />, { isAuthenticated: true });

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
    expect(quantityInput.max).toBe('3');

    // Try to increase quantity beyond available stock
    const increaseButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseButton); // quantity = 2
    fireEvent.click(increaseButton); // quantity = 3
    fireEvent.click(increaseButton); // should not increase beyond 3

    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(increaseButton).toBeDisabled();
  });

  it('uses custom onAddToCart when provided', async () => {
    const mockOnAddToCart = vi.fn();
    renderWithProviders(
      <ProductDetail product={mockProduct} onAddToCart={mockOnAddToCart} />,
      { isAuthenticated: true }
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith('product-1', 1);
    expect(mockCartService.addToCart).not.toHaveBeenCalled();
  });
});