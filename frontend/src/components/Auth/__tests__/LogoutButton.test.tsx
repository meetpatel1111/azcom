import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LogoutButton from '../LogoutButton';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('LogoutButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button variant by default', () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-red-600');
  });

  it('renders link variant when specified', () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton variant="link" />);

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveClass('bg-red-600');
    expect(button).toHaveClass('text-gray-700');
  });

  it('shows icon by default', () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton />);

    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton showIcon={false} />);

    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton className="custom-class" />);

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toHaveClass('custom-class');
  });

  it('calls logout function when clicked', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state during logout', async () => {
    const mockLogout = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    // Check loading state
    expect(screen.getByText('Signing out...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Signing out...')).not.toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('handles logout errors gracefully', async () => {
    const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    });

    // Button should not be disabled after error
    expect(button).not.toBeDisabled();
    
    consoleSpy.mockRestore();
  });

  it('disables button during logout process', async () => {
    const mockLogout = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    
    expect(button).not.toBeDisabled();
    
    fireEvent.click(button);
    
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('shows loading spinner during logout', async () => {
    const mockLogout = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    mockUseAuth.mockReturnValue({
      logout: mockLogout,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});