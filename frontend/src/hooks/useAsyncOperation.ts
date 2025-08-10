import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

export interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
  isError: boolean;
}

export interface UseAsyncOperationReturn extends AsyncOperationState {
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAsyncOperation = (initialLoading = false): UseAsyncOperationReturn => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const { error, isError, setError, clearError } = useErrorHandler();

  const execute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setIsLoading(true);
      clearError();
      const result = await asyncFn();
      return result;
    } catch (error) {
      setError(error as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setError, clearError]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    clearError();
  }, [clearError]);

  return {
    isLoading,
    error,
    isError,
    execute,
    setLoading,
    clearError,
    reset,
  };
};

export default useAsyncOperation;