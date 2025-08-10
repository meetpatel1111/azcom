import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import InventoryManager from '../InventoryManager';
import { productService } from '../../../services/productService';
import { Product } from '../../../types';

// Mock productService
vi.mock('../../../services/productService');
const mockProductService = vi.mocked(productService);

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    description: 'Description 1',
    price: 99.99,
    category: 'Electronics',
    imageUrl: 'https://example.com/image1.jpg',
    inventory: 50,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Product 2',
    description: 'Description 2',
    price: 29.99,
    category: 'Books',
    imageUrl: 'https://example.com/image2.jpg',
    inventory: 5, // Low inventory
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Product 3',
    description: 'Description 3',
    price: 19.99,
    category: 'Clothing',
    imageUrl: 'https://example.com/image3.jpg',
    inventory: 0, // Out of stock
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

const mockOnProductUpdate = vi.fn();

describe('InventoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductService.updateProduct.mockResolvedValue({} as Product);
  });

  it('renders inventory statistics correctly', () => {
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Total products
    expect(screen.getByText('1')).toBeInTheDocument(); // In stock (>10)
    expect(screen.getByText('1')).toBeInTheDocument(); // Low stock (1-10)
    expect(screen.getByText('1')).toBeInTheDocument(); // Out of stock (0)
  });

  it('displays all products in table', () => {
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
    
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  it('shows correct inventory status badges', () => {
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    expect(screen.getByText('In Stock')).toBeInTheDocument(); // Product 1
    expect(screen.getByText('Low Stock')).toBeInTheDocument(); // Product 2
    expect(screen.getByText('Out of Stock')).toBeInTheDocument(); // Product 3
  });

  it('filters products by search term', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or category...');
    await user.type(searchInput, 'Electronics');

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Product 3')).not.toBeInTheDocument();
  });

  it('filters products by stock status', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    const filterSelect = screen.getByDisplayValue('All Products');
    await user.selectOptions(filterSelect, 'low');

    expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.queryByText('Product 3')).not.toBeInTheDocument();
  });

  it('sorts products by name', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    const sortSelect = screen.getByDisplayValue('Name');
    const orderSelect = screen.getByDisplayValue('Ascending');

    // Products should be sorted by name in ascending order by default
    const productRows = screen.getAllByRole('row');
    expect(productRows[1]).toHaveTextContent('Product 1');
    expect(productRows[2]).toHaveTextContent('Product 2');
    expect(productRows[3]).toHaveTextContent('Product 3');
  });

  it('sorts products by inventory', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    const sortSelect = screen.getByDisplayValue('Name');
    await user.selectOptions(sortSelect, 'inventory');

    // Should sort by inventory ascending (0, 5, 50)
    await waitFor(() => {
      const productRows = screen.getAllByRole('row');
      expect(productRows[1]).toHaveTextContent('Product 3'); // 0 inventory
      expect(productRows[2]).toHaveTextContent('Product 2'); // 5 inventory
      expect(productRows[3]).toHaveTextContent('Product 1'); // 50 inventory
    });
  });

  it('updates individual product inventory', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    // Find inventory input for Product 1 (should show 50)
    const inventoryInputs = screen.getAllByDisplayValue('50');
    const inventoryInput = inventoryInputs[0];
    
    // Clear and type new value
    await user.clear(inventoryInput);
    await user.type(inventoryInput, '75');

    // Update button should appear
    const updateButton = screen.getByText('Update');
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockProductService.updateProduct).toHaveBeenCalledWith('1', { inventory: 75 });
      expect(mockOnProductUpdate).toHaveBeenCalled();
    });
  });

  it('cancels pending inventory update', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    // Find inventory input for Product 1
    const inventoryInputs = screen.getAllByDisplayValue('50');
    const inventoryInput = inventoryInputs[0];
    
    // Change value
    await user.clear(inventoryInput);
    await user.type(inventoryInput, '75');

    // Cancel button should appear
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Value should revert to original
    expect(inventoryInput).toHaveValue(50);
    expect(screen.queryByText('Update')).not.toBeInTheDocument();
  });

  it('performs bulk inventory update', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    // Update multiple products
    const inventoryInputs = screen.getAllByRole('spinbutton');
    
    // Update Product 1 inventory
    await user.clear(inventoryInputs[0]);
    await user.type(inventoryInputs[0], '75');
    
    // Update Product 2 inventory
    await user.clear(inventoryInputs[1]);
    await user.type(inventoryInputs[1], '15');

    // Bulk update button should appear
    const bulkUpdateButton = screen.getByText('Update All (2)');
    await user.click(bulkUpdateButton);

    await waitFor(() => {
      expect(mockProductService.updateProduct).toHaveBeenCalledWith('1', { inventory: 75 });
      expect(mockProductService.updateProduct).toHaveBeenCalledWith('2', { inventory: 15 });
      expect(mockOnProductUpdate).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    mockProductService.updateProduct.mockRejectedValue(new Error('Update failed'));
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    // Try to update inventory
    const inventoryInputs = screen.getAllByDisplayValue('50');
    const inventoryInput = inventoryInputs[0];
    
    await user.clear(inventoryInput);
    await user.type(inventoryInput, '75');

    const updateButton = screen.getByText('Update');
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('validates inventory input values', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    const inventoryInputs = screen.getAllByDisplayValue('50');
    const inventoryInput = inventoryInputs[0];
    
    // Try to enter negative value
    await user.clear(inventoryInput);
    await user.type(inventoryInput, '-10');

    // Update button should not appear for invalid values
    expect(screen.queryByText('Update')).not.toBeInTheDocument();
  });

  it('shows no products message when filtered results are empty', async () => {
    const user = userEvent.setup();
    
    render(
      <InventoryManager
        products={mockProducts}
        onProductUpdate={mockOnProductUpdate}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or category...');
    await user.type(searchInput, 'NonexistentProduct');

    expect(screen.getByText('No products found matching your criteria.')).toBeInTheDocument();
  });
});