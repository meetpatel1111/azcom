import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ShoppingCart from '../ShoppingCart';
import { CartSummary } from '../../../types';

// Mock the cart context
const mockUseCart = vi.fn();
vi.mock('../../../context/CartContext', () => ({
  useCart: () => mockUseCart(),
}));

// Mock the cart components
vi.mock('../CartItem', () => ({
  default: ({ item }: any) => <div data-testid={`cart-item-${item.productId}`}>{item.product?.name}</div>,
}));

vi.mock('../CartSummary', () => ({
  default: ({ summary }: any) => <div data-testid="cart-summary">Total: ${summary.total}</div>,
}));

vi.mock('../../UI/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

const mockCart = {
  id: 'cart-1',
  userId: 'user-1',
  items: [
    {
      productId: 'product-1',
      quantity: 2,
      addedAt: '2023-01-01T00:00:00Z',
      product: {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        category: 'Electronics',
        imageUrl: '/test-image.jpg',
        inventory: 10,
        description: 'Test description',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    },
  ],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockSummary: CartSummary = {
  itemCount: 2,
  uniqueItems: 1,
  subtotal: 59.98,
  total: 59.98,
  isEmpty: false,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ShoppingCart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when loading', () => {
    mockUseCart.mockReturnValue({
      cart: null,
      summary: { isEmpty: true },
      isLoading: true,
      error: null,
      clearCart: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    const mockClearError = vi.fn();
    mockUseCart.mockReturnValue({
      cart: null,
      summary: { isEmpty: true },
      isLoading: false,
      error: 'Failed to load cart',
      clearCart: vi.fn(),
      clearError: mockClearError,
    });

    renderWithRouter(<ShoppingCart />);

    expect(screen.getByText('Error loading cart')).toBeInTheDocument();
    expect(screen.getByText('Failed to load cart')).toBeInTheDocument();
    
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it('shows empty cart message when cart is empty', () => {
    mockUseCart.mockReturnValue({
      cart: null,
      summary: { isEmpty: true },
      isLoading: false,
      error: null,
      clearCart: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Start adding some products to your cart.')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('displays cart items and summary when cart has items', () => {
    mockUseCart.mockReturnValue({
      cart: mockCart,
      summary: mockSummary,
      isLoading: false,
      error: null,
      clearCart: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByTestId('cart-item-product-1')).toBeInTheDocument();
    expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });

  it('shows clear cart button and handles clear cart action', async () => {
    const mockClearCart = vi.fn().mockResolvedValue(undefined);
    window.confirm = vi.fn().mockReturnValue(true);

    mockUseCart.mockReturnValue({
      cart: mockCart,
      summary: mockSummary,
      isLoading: false,
      error: null,
      clearCart: mockClearCart,
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your cart?');
      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });
  });

  it('does not clear cart when user cancels confirmation', async () => {
    const mockClearCart = vi.fn();
    window.confirm = vi.fn().mockReturnValue(false);

    mockUseCart.mockReturnValue({
      cart: mockCart,
      summary: mockSummary,
      isLoading: false,
      error: null,
      clearCart: mockClearCart,
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your cart?');
      expect(mockClearCart).not.toHaveBeenCalled();
    });
  });

  it('handles clear cart error gracefully', async () => {
    const mockClearCart = vi.fn().mockRejectedValue(new Error('Clear cart failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.confirm = vi.fn().mockReturnValue(true);

    mockUseCart.mockReturnValue({
      cart: mockCart,
      summary: mockSummary,
      isLoading: false,
      error: null,
      clearCart: mockClearCart,
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear cart:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('shows continue shopping link', () => {
    mockUseCart.mockReturnValue({
      cart: mockCart,
      summary: mockSummary,
      isLoading: false,
      error: null,
      clearCart: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    const continueShoppingLink = screen.getByText('Continue Shopping');
    expect(continueShoppingLink).toBeInTheDocument();
    expect(continueShoppingLink.closest('a')).toHaveAttribute('href', '/products');
  });

  it('shows checkout button that links to checkout page', () => {
    mockUseCart.mockReturnValue({
      cart: mockCart,
      summary: mockSummary,
      isLoading: false,
      error: null,
      clearCart: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(<ShoppingCart />);

    const checkoutButton = screen.getByText('Checkout');
    expect(checkoutButton).toBeInTheDocument();
    expect(checkoutButton.closest('a')).toHaveAttribute('href', '/checkout');
  });
});