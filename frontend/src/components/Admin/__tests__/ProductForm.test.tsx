import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProductForm from '../ProductForm';
import { Product } from '../../../types';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 99.99,
  category: 'Electronics',
  imageUrl: 'https://example.com/image.jpg',
  inventory: 50,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

describe('ProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form for creating new product', () => {
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inventory/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
  });

  it('renders form for editing existing product', () => {
    render(
      <ProductForm
        product={mockProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('99.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update product/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    expect(screen.getByText('Product name is required')).toBeInTheDocument();
    expect(screen.getByText('Product description is required')).toBeInTheDocument();
    expect(screen.getByText('Price is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Image URL is required')).toBeInTheDocument();
    expect(screen.getByText('Inventory is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates price is positive number', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '-10');

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    expect(screen.getByText('Price must be a positive number')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates inventory is non-negative number', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const inventoryInput = screen.getByLabelText(/inventory/i);
    await user.type(inventoryInput, '-5');

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    expect(screen.getByText('Inventory must be a non-negative number')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates image URL format', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const imageUrlInput = screen.getByLabelText(/image url/i);
    await user.type(imageUrlInput, 'invalid-url');

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in all required fields
    await user.type(screen.getByLabelText(/product name/i), 'New Product');
    await user.type(screen.getByLabelText(/category/i), 'Books');
    await user.type(screen.getByLabelText(/price/i), '29.99');
    await user.type(screen.getByLabelText(/inventory/i), '100');
    await user.type(screen.getByLabelText(/image url/i), 'https://example.com/book.jpg');
    await user.type(screen.getByLabelText(/description/i), 'A great book');

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Product',
        category: 'Books',
        price: 29.99,
        inventory: 100,
        imageUrl: 'https://example.com/book.jpg',
        description: 'A great book',
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('displays loading state', () => {
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create product/i });
    expect(submitButton).toBeDisabled();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('displays error message', () => {
    const errorMessage = 'Failed to create product';
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays success message', () => {
    const successMessage = 'Product created successfully!';
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        successMessage={successMessage}
      />
    );

    expect(screen.getByText(successMessage)).toBeInTheDocument();
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Trigger validation error
    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    expect(screen.getByText('Product name is required')).toBeInTheDocument();

    // Start typing to clear error
    const nameInput = screen.getByLabelText(/product name/i);
    await user.type(nameInput, 'Test');

    expect(screen.queryByText('Product name is required')).not.toBeInTheDocument();
  });

  it('shows image preview for valid URL', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const imageUrlInput = screen.getByLabelText(/image url/i);
    await user.type(imageUrlInput, 'https://example.com/image.jpg');

    await waitFor(() => {
      expect(screen.getByText('Image Preview')).toBeInTheDocument();
      expect(screen.getByAltText('Product preview')).toBeInTheDocument();
    });
  });
});