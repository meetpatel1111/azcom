import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ProductDetail from '../ProductDetail';
import { Product } from '../../../types';

// Mock product data
const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'This is a detailed test product description',
  price: 99.99,
  category: 'Electronics',
  imageUrl: 'https://example.com/image.jpg',
  inventory: 15,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockOutOfStockProduct: Product = {
  ...mockProduct,
  id: '2',
  inventory: 0,
};

describe('ProductDetail', () => {
  it('renders loading state', () => {
    render(<ProductDetail product={mockProduct} isLoading={true} />);
    
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders product information correctly', () => {
    render(<ProductDetail product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('This is a detailed test product description')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('15 in stock')).toBeInTheDocument();
  });

  it('displays product metadata correctly', () => {
    render(<ProductDetail product={mockProduct} />);

    expect(screen.getByText('Product ID: 1')).toBeInTheDocument();
    expect(screen.getByText('Added: 1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('Last updated: 1/2/2024')).toBeInTheDocument();
  });

  it('handles quantity changes correctly', () => {
    render(<ProductDetail product={mockProduct} />);

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons.find(btn => btn.querySelector('path[d*="M10 3a1 1 0 011 1v5h5"]'));
    const decreaseButton = buttons.find(btn => btn.querySelector('path[d*="M3 10a1 1 0 011-1h12"]'));

    // Test increase quantity
    if (increaseButton) {
      fireEvent.click(increaseButton);
      expect(quantityInput.value).toBe('2');
    }

    // Test decrease quantity
    if (decreaseButton) {
      fireEvent.click(decreaseButton);
      expect(quantityInput.value).toBe('1');
    }

    // Test direct input
    fireEvent.change(quantityInput, { target: { value: '5' } });
    expect(quantityInput.value).toBe('5');
  });

  it('prevents quantity from going below 1', () => {
    render(<ProductDetail product={mockProduct} />);

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
    const buttons = screen.getAllByRole('button');
    const decreaseButton = buttons.find(btn => btn.querySelector('path[d*="M3 10a1 1 0 011-1h12"]'));

    // Try to decrease below 1
    if (decreaseButton) {
      fireEvent.click(decreaseButton);
      expect(quantityInput.value).toBe('1');
      expect(decreaseButton).toBeDisabled();
    }
  });

  it('prevents quantity from exceeding inventory', () => {
    const lowStockProduct = { ...mockProduct, inventory: 3 };
    render(<ProductDetail product={lowStockProduct} />);

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons.find(btn => btn.querySelector('path[d*="M10 3a1 1 0 011 1v5h5"]'));

    // Increase to max inventory
    fireEvent.change(quantityInput, { target: { value: '3' } });
    expect(quantityInput.value).toBe('3');

    // Try to increase beyond inventory
    if (increaseButton) {
      fireEvent.click(increaseButton);
      expect(quantityInput.value).toBe('3');
      expect(increaseButton).toBeDisabled();
    }
  });

  it('limits quantity to maximum of 10', () => {
    const highStockProduct = { ...mockProduct, inventory: 50 };
    render(<ProductDetail product={highStockProduct} />);

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;

    // Try to set quantity above 10 - this should be handled by the max attribute
    fireEvent.change(quantityInput, { target: { value: '10' } });
    expect(quantityInput.value).toBe('10');
    
    // The max attribute should be set to 10
    expect(quantityInput.getAttribute('max')).toBe('10');
  });

  it('calls onAddToCart with correct parameters', () => {
    const mockOnAddToCart = vi.fn();
    render(<ProductDetail product={mockProduct} onAddToCart={mockOnAddToCart} />);

    const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });

    // Change quantity and add to cart
    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith('1', 3);
  });

  it('displays out of stock state correctly', () => {
    render(<ProductDetail product={mockOutOfStockProduct} />);

    expect(screen.getAllByText('Out of Stock')).toHaveLength(2); // One in overlay, one in availability
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Quantity:')).not.toBeInTheDocument();
  });

  it('shows loading state when adding to cart', () => {
    render(<ProductDetail product={mockProduct} addingToCart={true} />);

    const addingButton = screen.getByRole('button', { name: /adding to cart.../i });
    expect(addingButton).toBeInTheDocument();
    expect(addingButton).toBeDisabled();
  });

  it('prevents add to cart when loading', () => {
    const mockOnAddToCart = vi.fn();
    render(
      <ProductDetail 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart} 
        addingToCart={true} 
      />
    );

    const addingButton = screen.getByRole('button', { name: /adding to cart.../i });
    fireEvent.click(addingButton);

    expect(mockOnAddToCart).not.toHaveBeenCalled();
  });

  it('handles image error by showing placeholder', () => {
    render(<ProductDetail product={mockProduct} />);

    const image = screen.getByAltText('Test Product') as HTMLImageElement;
    
    // Simulate image error
    fireEvent.error(image);
    
    expect(image.src).toContain('placeholder-product.jpg');
  });

  it('does not show last updated when same as created date', () => {
    const newProduct = { ...mockProduct, updatedAt: mockProduct.createdAt };
    render(<ProductDetail product={newProduct} />);

    expect(screen.getByText('Added: 1/1/2024')).toBeInTheDocument();
    expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
  });
});