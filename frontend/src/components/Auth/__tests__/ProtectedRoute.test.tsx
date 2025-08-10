import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/protected']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: true,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // Since we're using Navigate, the component should not render
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'customer', email: 'user@example.com' },
      isLoading: false,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to home when admin access is required but user is not admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'customer', email: 'user@example.com' },
      isLoading: false,
    });

    renderWithRouter(
      <ProtectedRoute requireAdmin>
        <TestComponent />
      </ProtectedRoute>
    );

    // Since we're using Navigate, the component should not render
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when admin access is required and user is admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'admin', email: 'admin@example.com' },
      isLoading: false,
    });

    renderWithRouter(
      <ProtectedRoute requireAdmin>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('works without requireAdmin prop (defaults to false)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'customer', email: 'user@example.com' },
      isLoading: false,
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});