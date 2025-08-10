import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Register from '../Register';
import { AuthProvider } from '../../context/AuthContext';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  register: vi.fn(),
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

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText('sign in to your existing account')).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<Register />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
  });

  it('shows validation error for short names', async () => {
    renderWithProviders(<Register />);
    
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'A' } });
    fireEvent.change(lastNameInput, { target: { value: 'B' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderWithProviders(<Register />);
    
    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for weak password', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for password without required characters', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('toggles password visibility for both password fields', () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button', { name: '' }); // The eye icon buttons

    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('password');
    
    // Toggle password visibility
    fireEvent.click(toggleButtons[0]);
    expect(passwordInput.type).toBe('text');
    
    // Toggle confirm password visibility
    fireEvent.click(toggleButtons[1]);
    expect(confirmPasswordInput.type).toBe('text');
  });

  it('updates form data when typing', () => {
    renderWithProviders(<Register />);
    
    const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
    const lastNameInput = screen.getByLabelText('Last Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

    expect(firstNameInput.value).toBe('John');
    expect(lastNameInput.value).toBe('Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(passwordInput.value).toBe('Password123');
    expect(confirmPasswordInput.value).toBe('Password123');
  });

  it('clears errors when form data changes', async () => {
    renderWithProviders(<Register />);
    
    const firstNameInput = screen.getByLabelText('First Name');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Trigger validation error
    fireEvent.submit(submitButton.closest('form')!);
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });

    // Type in first name field to clear error
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
    });
  });

  it('shows terms and privacy policy notice', () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByText('By creating an account, you agree to our Terms of Service and Privacy Policy')).toBeInTheDocument();
  });

  it('has link to login page', () => {
    renderWithProviders(<Register />);
    
    const loginLink = screen.getByText('sign in to your existing account');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });
});