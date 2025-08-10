import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProductList from '../ProductList';
import { Product } from '../../../types';

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    description: 'Description 1',
    price: 29.99,
    category: 'Electronics',
    imageUrl: 'https://example.com/image1.jpg',
    inventory: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Product 2',
    description: 'Description 2',
    price: 39.99,
    category: 'Clothing',
    imageUrl: 'https://example.com/image2.jpg',
    inventory: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Wrapper component for router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ProductList', () => {
  it('renders loading state', () => {
    render(
      <RouterWrapper>
        <ProductList products={[]} isLoading={true} />
      </RouterWrapper>
    );

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders empty state when no products', () => {
    render(
      <RouterWrapper>
        <ProductList products={[]} />
      </RouterWrapper>
    );

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
  });

  it('renders products correctly', () => {
    render(
      <RouterWrapper>
        <ProductList products={mockProducts} />
      </RouterWrapper>
    );

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 products')).toBeInTheDocument();
  });

  it('renders singular product count correctly', () => {
    render(
      <RouterWrapper>
        <ProductList products={[mockProducts[0]]} />
      </RouterWrapper>
    );

    expect(screen.getByText('Showing 1 product')).toBeInTheDocument();
  });

  it('switches between grid and list view', () => {
    render(
      <RouterWrapper>
        <ProductList products={mockProducts} />
      </RouterWrapper>
    );

    const gridButton = screen.getByTitle('Grid view');
    const listButton = screen.getByTitle('List view');

    // Should start in grid view
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).toHaveClass('bg-white');

    // Switch to list view
    fireEvent.click(listButton);
    expect(listButton).toHaveClass('bg-blue-600');
    expect(gridButton).toHaveClass('bg-white');

    // Switch back to grid view
    fireEvent.click(gridButton);
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).toHaveClass('bg-white');
  });

  it('calls onAddToCart when product card add to cart is clicked', () => {
    const mockOnAddToCart = vi.fn();
    
    render(
      <RouterWrapper>
        <ProductList products={mockProducts} onAddToCart={mockOnAddToCart} />
      </RouterWrapper>
    );

    const addToCartButtons = screen.getAllByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButtons[0]);

    expect(mockOnAddToCart).toHaveBeenCalledWith('1');
  });

  it('shows loading state for specific product being added to cart', () => {
    render(
      <RouterWrapper>
        <ProductList products={mockProducts} addingToCart="1" />
      </RouterWrapper>
    );

    expect(screen.getByRole('button', { name: /adding.../i })).toBeInTheDocument();
    
    // Other product should still show normal add to cart button
    const addToCartButtons = screen.getAllByRole('button', { name: /add to cart/i });
    expect(addToCartButtons).toHaveLength(1); // Only one should not be in loading state
  });

  it('applies correct CSS classes for grid view', () => {
    const { container } = render(
      <RouterWrapper>
        <ProductList products={mockProducts} />
      </RouterWrapper>
    );

    const productContainer = container.querySelector('.grid');
    expect(productContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4', 'gap-6');
  });

  it('applies correct CSS classes for list view', () => {
    const { container } = render(
      <RouterWrapper>
        <ProductList products={mockProducts} />
      </RouterWrapper>
    );

    // Switch to list view
    const listButton = screen.getByTitle('List view');
    fireEvent.click(listButton);

    const productContainer = container.querySelector('.space-y-4');
    expect(productContainer).toBeInTheDocument();
  });
});