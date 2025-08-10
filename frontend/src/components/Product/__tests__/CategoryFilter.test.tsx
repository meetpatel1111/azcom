import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CategoryFilter from '../CategoryFilter';

const mockCategories = ['Electronics', 'Clothing', 'Books', 'Home & Garden'];

describe('CategoryFilter', () => {
  it('renders loading state', () => {
    const mockOnCategoryChange = vi.fn();
    render(
      <CategoryFilter
        categories={[]}
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
        isLoading={true}
      />
    );

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    // In loading state, the "Categories" text is not rendered, only skeleton
  });

  it('renders categories correctly', () => {
    const mockOnCategoryChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    
    mockCategories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it('highlights selected category', () => {
    const mockOnCategoryChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="Electronics"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const electronicsButton = screen.getByText('Electronics');
    expect(electronicsButton).toHaveClass('bg-blue-100', 'text-blue-800', 'font-medium');

    const clothingButton = screen.getByText('Clothing');
    expect(clothingButton).toHaveClass('text-gray-700');
  });

  it('highlights "All Categories" when no category is selected', () => {
    const mockOnCategoryChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const allCategoriesButton = screen.getByText('All Categories');
    expect(allCategoriesButton).toHaveClass('bg-blue-100', 'text-blue-800', 'font-medium');
  });

  it('calls onCategoryChange when category is clicked', () => {
    const mockOnCategoryChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const electronicsButton = screen.getByText('Electronics');
    fireEvent.click(electronicsButton);

    expect(mockOnCategoryChange).toHaveBeenCalledWith('Electronics');
  });

  it('calls onCategoryChange with null when "All Categories" is clicked', () => {
    const mockOnCategoryChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="Electronics"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const allCategoriesButton = screen.getByText('All Categories');
    fireEvent.click(allCategoriesButton);

    expect(mockOnCategoryChange).toHaveBeenCalledWith(null);
  });

  it('renders empty state when no categories provided', () => {
    const mockOnCategoryChange = vi.fn();
    render(
      <CategoryFilter
        categories={[]}
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    
    // Should not render any category buttons
    mockCategories.forEach(category => {
      expect(screen.queryByText(category)).not.toBeInTheDocument();
    });
  });
});