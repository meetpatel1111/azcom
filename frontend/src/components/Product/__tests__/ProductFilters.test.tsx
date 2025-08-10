import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ProductFilters from '../ProductFilters';
import { ProductFilters as IProductFilters } from '../../../types';

const mockCategories = ['Electronics', 'Clothing', 'Books'];
const mockFilters: IProductFilters = {};

describe('ProductFilters', () => {
  it('renders all filter sections', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={mockCategories}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Availability')).toBeInTheDocument();
  });

  it('shows clear all button when filters are active', () => {
    const mockOnFiltersChange = vi.fn();
    const filtersWithCategory: IProductFilters = { category: 'Electronics' };
    
    render(
      <ProductFilters
        categories={mockCategories}
        filters={filtersWithCategory}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('hides clear all button when no filters are active', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={mockCategories}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('calls onFiltersChange when category is changed', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={mockCategories}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const electronicsButton = screen.getByText('Electronics');
    fireEvent.click(electronicsButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ category: 'Electronics' });
  });

  it('handles price range changes', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={mockCategories}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minPriceInput = screen.getByPlaceholderText('Min');
    const maxPriceInput = screen.getByPlaceholderText('Max');

    fireEvent.change(minPriceInput, { target: { value: '10' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ minPrice: 10, maxPrice: undefined });

    fireEvent.change(maxPriceInput, { target: { value: '100' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ minPrice: 10, maxPrice: 100 });
  });

  it('handles invalid price inputs', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={mockCategories}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minPriceInput = screen.getByPlaceholderText('Min');
    
    // First set a valid value
    fireEvent.change(minPriceInput, { target: { value: '10' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ minPrice: 10, maxPrice: undefined });
    
    // Then set an invalid value - should result in undefined
    mockOnFiltersChange.mockClear();
    fireEvent.change(minPriceInput, { target: { value: 'invalid' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ minPrice: undefined, maxPrice: undefined });
  });

  it('handles in stock toggle', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={mockCategories}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const inStockCheckbox = screen.getByRole('checkbox', { name: /in stock only/i });
    fireEvent.click(inStockCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ inStock: true });
  });

  it('clears all filters when clear all is clicked', () => {
    const mockOnFiltersChange = vi.fn();
    const activeFilters: IProductFilters = {
      category: 'Electronics',
      minPrice: 10,
      maxPrice: 100,
      inStock: true,
    };

    render(
      <ProductFilters
        categories={mockCategories}
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });
  });

  it('displays current filter values', () => {
    const mockOnFiltersChange = vi.fn();
    const activeFilters: IProductFilters = {
      category: 'Electronics',
      minPrice: 10,
      maxPrice: 100,
      inStock: true,
    };

    render(
      <ProductFilters
        categories={mockCategories}
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Category should be selected
    const electronicsButton = screen.getByText('Electronics');
    expect(electronicsButton).toHaveClass('bg-blue-100');

    // Price inputs should have values
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();

    // In stock checkbox should be checked
    const inStockCheckbox = screen.getByRole('checkbox', { name: /in stock only/i });
    expect(inStockCheckbox).toBeChecked();
  });

  it('toggles expansion on mobile', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={mockCategories}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const expandButton = screen.getByLabelText('Expand filters');
    fireEvent.click(expandButton);

    expect(screen.getByLabelText('Collapse filters')).toBeInTheDocument();
  });

  it('shows loading state for categories', () => {
    const mockOnFiltersChange = vi.fn();
    render(
      <ProductFilters
        categories={[]}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        isLoading={true}
      />
    );

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});