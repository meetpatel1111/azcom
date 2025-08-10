import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../Login';
import { AuthProvider } from '../../context/AuthContext';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  TokenManager: {
    hasValidToken: vi.fn(() => false),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
  handleApiError: vi.fn(),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText('create a new account')).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: '' }); // The eye icon button

    expect(passwordInput.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('updates form data when typing', () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('clears errors when form data changes', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Trigger validation error
    fireEvent.submit(submitButton.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Type in email field to clear error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  it('shows demo credentials', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Demo credentials: admin@example.com / AdminPassword123')).toBeInTheDocument();
  });

  it('has link to register page', () => {
    renderWithProviders(<Login />);
    
    const registerLink = screen.getByText('create a new account');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});