import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AxiosError } from 'axios';
import { useErrorHandler } from '../useErrorHandler';

// Mock the API error handler
vi.mock('../../services/api', () => ({
  handleApiError: vi.fn((error: AxiosError) => ({
    error: 'API Error',
    message: error.message || 'API request failed',
  })),
}));

describe('useErrorHandler', () => {
  it('initializes with no error by default', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.errorDetails).toBeUndefined();
  });

  it('initializes with provided error', () => {
    const { result } = renderHook(() => useErrorHandler('Initial error'));

    expect(result.current.error).toBe('Initial error');
    expect(result.current.isError).toBe(true);
  });

  it('sets string error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.setError('Test error message');
    });

    expect(result.current.error).toBe('Test error message');
    expect(result.current.isError).toBe(true);
    expect(result.current.errorDetails).toBeUndefined();
  });

  it('clears error correctly', () => {
    const { result } = renderHook(() => useErrorHandler('Initial error'));

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.errorDetails).toBeUndefined();
  });

  it('handles regular Error objects', () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Regular error');

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.error).toBe('Regular error');
    expect(result.current.isError).toBe(true);
    expect(result.current.errorDetails).toBeUndefined();
  });
});