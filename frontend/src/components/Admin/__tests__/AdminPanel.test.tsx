import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AdminPanel from '../AdminPanel';
import { useAuth } from '../../../context/AuthContext';
import { productService } from '../../../services/productService';
import { Product, User } from '../../../types';

// Mock dependencies
vi.mock('../../../context/AuthContext');
vi.mock('../../../services/productService');

const mockUseAuth = vi.mocked(useAuth);
const mockProductService = vi.mocked(productService);

const mockAdminUser: User = {
  id: '1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockCustomerUser: User = {
  id: '2',
  email: 'customer@example.com',
  firstName: 'Customer',
  lastName: 'User',
  role: 'customer',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

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
];

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductService.getProducts.mockResolvedValue({
      data: mockProducts,
      pagination: {
        page: 1,
        limit: 100,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
    mockProductService.getLowInventoryProducts.mockResolvedValue([mockProducts[1]]);
  });

  it('renders access denied for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: mockCustomerUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    render(<AdminPanel />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access the admin panel.")).toBeInTheDocument();
  });

  it('renders access denied for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    render(<AdminPanel />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders admin panel for admin users', async () => {
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    render(<AdminPanel />);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Manage your products and inventory')).toBeInTheDocument();
    
    // Check navigation tabs
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inventory' })).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total products count
    });
  });

  it('displays dashboard statistics correctly', async () => {
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Low Inventory')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Total Value')).toBeInTheDocument();
      // Total value: (99.99 * 50) + (29.99 * 5) = 4999.5 + 149.95 = 5149.45
      expect(screen.getByText('$5149.45')).toBeInTheDocument();
    });
  });

  it('displays low inventory alert', async () => {
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Low Inventory Alert')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('5 left')).toBeInTheDocument();
    });
  });

  it('navigates to products view', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    render(<AdminPanel />);

    const productsTab = screen.getByRole('button', { name: 'Products' });
    await user.click(productsTab);

    await waitFor(() => {
      expect(screen.getByText('Products Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add New Product' })).toBeInTheDocument();
    });
  });

  it('navigates to add product form', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    render(<AdminPanel />);

    // Navigate to products
    const productsTab = screen.getByRole('button', { name: 'Products' });
    await user.click(productsTab);

    // Click add new product
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: 'Add New Product' });
      return user.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    });
  });

  it('creates new product successfully', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    mockProductService.createProduct.mockResolvedValue({
      id: '3',
      name: 'New Product',
      description: 'New Description',
      price: 49.99,
      category: 'Clothing',
      imageUrl: 'https://example.com/image3.jpg',
      inventory: 25,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    });

    render(<AdminPanel />);

    // Navigate to add product form
    const productsTab = screen.getByRole('button', { name: 'Products' });
    await user.click(productsTab);

    await waitFor(async () => {
      const addButton = screen.getByRole('button', { name: 'Add New Product' });
      await user.click(addButton);
    });

    // Fill form
    await waitFor(async () => {
      await user.type(screen.getByLabelText(/product name/i), 'New Product');
      await user.type(screen.getByLabelText(/category/i), 'Clothing');
      await user.type(screen.getByLabelText(/price/i), '49.99');
      await user.type(screen.getByLabelText(/inventory/i), '25');
      await user.type(screen.getByLabelText(/image url/i), 'https://example.com/image3.jpg');
      await user.type(screen.getByLabelText(/description/i), 'New Description');
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProductService.createProduct).toHaveBeenCalledWith({
        name: 'New Product',
        category: 'Clothing',
        price: 49.99,
        inventory: 25,
        imageUrl: 'https://example.com/image3.jpg',
        description: 'New Description',
      });
    });
  });

  it('deletes product with confirmation', async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    mockProductService.deleteProduct.mockResolvedValue();

    render(<AdminPanel />);

    // Navigate to products
    const productsTab = screen.getByRole('button', { name: 'Products' });
    await user.click(productsTab);

    // Find and click delete button
    await waitFor(async () => {
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this product? This action cannot be undone.'
      );
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('1');
    });

    confirmSpy.mockRestore();
  });

  it('handles API errors gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      updateUser: vi.fn(),
      updateProfile: vi.fn(),
      checkAuth: vi.fn(),
    });

    mockProductService.getProducts.mockRejectedValue(new Error('Failed to load products'));

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load products')).toBeInTheDocument();
    });
  });
});