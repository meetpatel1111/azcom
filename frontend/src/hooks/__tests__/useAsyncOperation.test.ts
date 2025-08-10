import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAsyncOperation } from '../useAsyncOperation';

describe('useAsyncOperation', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAsyncOperation());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('initializes with loading state when specified', () => {
    const { result } = renderHook(() => useAsyncOperation(true));

    expect(result.current.isLoading).toBe(true);
  });

  it('handles successful async operation', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const successfulOperation = vi.fn().mockResolvedValue('success');

    let operationResult;
    await act(async () => {
      operationResult = await result.current.execute(successfulOperation);
    });

    expect(operationResult).toBe('success');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('handles failed async operation', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

    let operationResult;
    await act(async () => {
      operationResult = await result.current.execute(failingOperation);
    });

    expect(operationResult).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Operation failed');
    expect(result.current.isError).toBe(true);
  });

  it('sets loading state correctly', () => {
    const { result } = renderHook(() => useAsyncOperation());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });
});