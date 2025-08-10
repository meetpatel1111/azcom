import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProductCard from '../ProductCard';
import { Product } from '../../../types';

// Mock product data
const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'This is a test product description',
  price: 29.99,
  category: 'Electronics',
  imageUrl: 'https://example.com/image.jpg',
  inventory: 10,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOutOfStockProduct: Product = {
  ...mockProduct,
  id: '2',
  inventory: 0,
};

// Wrapper component for router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(
      <RouterWrapper>
        <ProductCard product={mockProduct} />
      </RouterWrapper>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
  });

  it('displays add to cart button when product is in stock', () => {
    render(
      <RouterWrapper>
        <ProductCard product={mockProduct} />
      </RouterWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).toBeInTheDocument();
    expect(addToCartButton).not.toBeDisabled();
  });

  it('calls onAddToCart when add to cart button is clicked', () => {
    const mockOnAddToCart = vi.fn();
    
    render(
      <RouterWrapper>
        <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />
      </RouterWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith('1');
  });

  it('displays out of stock state correctly', () => {
    render(
      <RouterWrapper>
        <ProductCard product={mockOutOfStockProduct} />
      </RouterWrapper>
    );

    expect(screen.getAllByText('Out of Stock')).toHaveLength(2); // One in overlay, one in button
    
    const addToCartButton = screen.getByRole('button', { name: /out of stock/i });
    expect(addToCartButton).toBeDisabled();
  });

  it('displays loading state when adding to cart', () => {
    render(
      <RouterWrapper>
        <ProductCard product={mockProduct} isLoading={true} />
      </RouterWrapper>
    );

    const addingButton = screen.getByRole('button', { name: /adding.../i });
    expect(addingButton).toBeInTheDocument();
    expect(addingButton).toBeDisabled();
  });

  it('prevents add to cart click when loading', () => {
    const mockOnAddToCart = vi.fn();
    
    render(
      <RouterWrapper>
        <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} isLoading={true} />
      </RouterWrapper>
    );

    const addingButton = screen.getByRole('button', { name: /adding.../i });
    fireEvent.click(addingButton);

    expect(mockOnAddToCart).not.toHaveBeenCalled();
  });

  it('links to product detail page', () => {
    render(
      <RouterWrapper>
        <ProductCard product={mockProduct} />
      </RouterWrapper>
    );

    const productLink = screen.getByRole('link');
    expect(productLink).toHaveAttribute('href', '/products/1');
  });

  it('handles image error by showing placeholder', () => {
    render(
      <RouterWrapper>
        <ProductCard product={mockProduct} />
      </RouterWrapper>
    );

    const image = screen.getByAltText('Test Product') as HTMLImageElement;
    
    // Simulate image error
    fireEvent.error(image);
    
    expect(image.src).toContain('placeholder-product.jpg');
  });
});