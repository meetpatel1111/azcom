import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderSummary from '../OrderSummary';
import { Cart, CartSummary, Product } from '../../../types';

describe('OrderSummary', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 29.99,
    category: 'Test Category',
    imageUrl: 'https://example.com/image.jpg',
    inventory: 10,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockCart: Cart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        productId: '1',
        quantity: 2,
        addedAt: '2023-01-01T00:00:00Z',
        product: mockProduct,
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

  it('renders empty cart message when cart is empty', () => {
    const emptySummary: CartSummary = {
      itemCount: 0,
      uniqueItems: 0,
      subtotal: 0,
      total: 0,
      isEmpty: true,
    };

    render(<OrderSummary cart={null} summary={emptySummary} />);
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders cart items with product details', () => {
    render(<OrderSummary cart={mockCart} summary={mockSummary} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Qty: 2')).toBeInTheDocument();
    expect(screen.getByText('$59.98')).toBeInTheDocument();
  });

  it('calculates and displays order totals correctly', () => {
    render(<OrderSummary cart={mockCart} summary={mockSummary} />);
    
    // Subtotal
    expect(screen.getByText('$59.98')).toBeInTheDocument();
    
    // Shipping (should be $9.99 since subtotal < $50)
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    
    // Tax (8% of subtotal)
    const expectedTax = (59.98 * 0.08).toFixed(2);
    expect(screen.getByText(`$${expectedTax}`)).toBeInTheDocument();
    
    // Total
    const expectedTotal = (59.98 + 9.99 + 59.98 * 0.08).toFixed(2);
    expect(screen.getByText(`$${expectedTotal}`)).toBeInTheDocument();
  });

  it('shows free shipping when subtotal is over $50', () => {
    const highValueSummary: CartSummary = {
      itemCount: 3,
      uniqueItems: 1,
      subtotal: 75.00,
      total: 75.00,
      isEmpty: false,
    };

    const highValueCart: Cart = {
      ...mockCart,
      items: [
        {
          productId: '1',
          quantity: 3,
          addedAt: '2023-01-01T00:00:00Z',
          product: { ...mockProduct, price: 25.00 },
        },
      ],
    };

    render(<OrderSummary cart={highValueCart} summary={highValueSummary} />);
    
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('shows free shipping promotion when applicable', () => {
    const lowValueSummary: CartSummary = {
      itemCount: 1,
      uniqueItems: 1,
      subtotal: 30.00,
      total: 30.00,
      isEmpty: false,
    };

    render(<OrderSummary cart={mockCart} summary={lowValueSummary} />);
    
    const remainingAmount = (50 - 30).toFixed(2);
    expect(screen.getByText(`Add $${remainingAmount} more to get free shipping!`)).toBeInTheDocument();
  });

  it('displays item count correctly', () => {
    render(<OrderSummary cart={mockCart} summary={mockSummary} />);
    
    expect(screen.getByText('Subtotal (2 items)')).toBeInTheDocument();
  });

  it('shows placeholder image when product image is not available', () => {
    const cartWithoutImage: Cart = {
      ...mockCart,
      items: [
        {
          productId: '1',
          quantity: 1,
          addedAt: '2023-01-01T00:00:00Z',
          product: { ...mockProduct, imageUrl: '' },
        },
      ],
    };

    render(<OrderSummary cart={cartWithoutImage} summary={mockSummary} />);
    
    // Should render SVG placeholder
    const svgElement = screen.getByRole('img', { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });

  it('handles missing product data gracefully', () => {
    const cartWithoutProduct: Cart = {
      ...mockCart,
      items: [
        {
          productId: '1',
          quantity: 1,
          addedAt: '2023-01-01T00:00:00Z',
        },
      ],
    };

    render(<OrderSummary cart={cartWithoutProduct} summary={mockSummary} />);
    
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('displays security notice', () => {
    render(<OrderSummary cart={mockCart} summary={mockSummary} />);
    
    expect(screen.getByText('Secure checkout')).toBeInTheDocument();
  });
});