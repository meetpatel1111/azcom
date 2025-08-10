import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UserProfile from '../UserProfile';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUser = {
  id: '1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer' as const,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders user profile information correctly', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
  });

  it('shows admin badge for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'admin' },
      isLoading: false,
      error: null,
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('enables editing when edit button is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    
    // Check that inputs are enabled
    const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
    expect(firstNameInput.disabled).toBe(false);
  });

  it('cancels editing and resets form data', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    // Start editing
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Change form data
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Cancel editing
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Check that form is reset and editing is disabled
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    
    const resetFirstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
    expect(resetFirstNameInput.disabled).toBe(true);
  });

  it('updates form data when typing', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    // Start editing
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Update form fields
    const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
    const lastNameInput = screen.getByDisplayValue('Doe') as HTMLInputElement;
    const emailInput = screen.getByDisplayValue('john@example.com') as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

    expect(firstNameInput.value).toBe('Jane');
    expect(lastNameInput.value).toBe('Smith');
    expect(emailInput.value).toBe('jane@example.com');
  });

  it('calls updateProfile when form is submitted', async () => {
    const mockUpdateProfile = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    // Start editing
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Update form data
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Submit form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });
  });

  it('shows success message after successful update', async () => {
    const mockUpdateProfile = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    // Start editing and submit
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });

    // Check that editing mode is disabled
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('displays error message when present', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: 'Update failed',
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    expect(screen.getByText('Update failed')).toBeInTheDocument();
  });

  it('clears error when error close button is clicked', () => {
    const mockClearError = vi.fn();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: 'Update failed',
      updateProfile: vi.fn(),
      clearError: mockClearError,
    });

    render(<UserProfile />);

    const closeButton = screen.getByRole('button', { name: '' }); // Close button
    fireEvent.click(closeButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('shows loading state during form submission', async () => {
    const mockUpdateProfile = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      clearError: vi.fn(),
    });

    render(<UserProfile />);

    // Start editing
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Submit form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Check loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });
});