import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SortOptions from '../SortOptions';

describe('SortOptions', () => {
  it('renders with default sort option', () => {
    const mockOnSortChange = vi.fn();
    render(
      <SortOptions
        currentSort={{}}
        onSortChange={mockOnSortChange}
      />
    );

    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Name (A-Z)')).toBeInTheDocument();
  });

  it('renders with current sort selection', () => {
    const mockOnSortChange = vi.fn();
    render(
      <SortOptions
        currentSort={{ sortBy: 'price', sortOrder: 'desc' }}
        onSortChange={mockOnSortChange}
      />
    );

    expect(screen.getByDisplayValue('Price (High to Low)')).toBeInTheDocument();
  });

  it('displays all sort options', () => {
    const mockOnSortChange = vi.fn();
    render(
      <SortOptions
        currentSort={{}}
        onSortChange={mockOnSortChange}
      />
    );

    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));
    
    expect(options).toHaveLength(6);
    expect(options.map(opt => opt.textContent)).toEqual([
      'Name (A-Z)',
      'Name (Z-A)',
      'Price (Low to High)',
      'Price (High to Low)',
      'Newest First',
      'Oldest First',
    ]);
  });

  it('calls onSortChange when option is selected', () => {
    const mockOnSortChange = vi.fn();
    render(
      <SortOptions
        currentSort={{}}
        onSortChange={mockOnSortChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'price-desc' } });

    expect(mockOnSortChange).toHaveBeenCalledWith('price', 'desc');
  });

  it('calls onSortChange with correct parameters for each option', () => {
    const mockOnSortChange = vi.fn();
    render(
      <SortOptions
        currentSort={{}}
        onSortChange={mockOnSortChange}
      />
    );

    const select = screen.getByRole('combobox');
    
    // Test each sort option
    const testCases = [
      { value: 'name-asc', expectedSortBy: 'name', expectedSortOrder: 'asc' },
      { value: 'name-desc', expectedSortBy: 'name', expectedSortOrder: 'desc' },
      { value: 'price-asc', expectedSortBy: 'price', expectedSortOrder: 'asc' },
      { value: 'price-desc', expectedSortBy: 'price', expectedSortOrder: 'desc' },
      { value: 'newest', expectedSortBy: 'createdAt', expectedSortOrder: 'desc' },
      { value: 'oldest', expectedSortBy: 'createdAt', expectedSortOrder: 'asc' },
    ];

    testCases.forEach(({ value, expectedSortBy, expectedSortOrder }) => {
      mockOnSortChange.mockClear();
      fireEvent.change(select, { target: { value } });
      expect(mockOnSortChange).toHaveBeenCalledWith(expectedSortBy, expectedSortOrder);
    });
  });

  it('handles unknown sort values gracefully', () => {
    const mockOnSortChange = vi.fn();
    render(
      <SortOptions
        currentSort={{ sortBy: 'unknown' as any, sortOrder: 'asc' }}
        onSortChange={mockOnSortChange}
      />
    );

    // Should fall back to default
    expect(screen.getByDisplayValue('Name (A-Z)')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const mockOnSortChange = vi.fn();
    render(
      <SortOptions
        currentSort={{}}
        onSortChange={mockOnSortChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'sort-select');
    
    const label = screen.getByText('Sort by:');
    expect(label).toHaveAttribute('for', 'sort-select');
  });
});