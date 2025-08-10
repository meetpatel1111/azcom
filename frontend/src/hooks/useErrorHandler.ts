import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { ApiError } from '../types';
import { handleApiError } from '../services/api';

export interface ErrorState {
  error: string | null;
  isError: boolean;
  errorDetails?: ApiError;
}

export interface UseErrorHandlerReturn extends ErrorState {
  setError: (error: string | Error | AxiosError | null) => void;
  clearError: () => void;
  handleAsyncError: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
}

export const useErrorHandler = (initialError: string | null = null): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: initialError,
    isError: !!initialError,
    errorDetails: undefined,
  });

  const setError = useCallback((error: string | Error | AxiosError | null) => {
    if (!error) {
      setErrorState({
        error: null,
        isError: false,
        errorDetails: undefined,
      });
      return;
    }

    if (typeof error === 'string') {
      setErrorState({
        error,
        isError: true,
        errorDetails: undefined,
      });
      return;
    }

    if (error instanceof Error) {
      // Handle AxiosError specifically
      if ('isAxiosError' in error && error.isAxiosError) {
        const apiError = handleApiError(error as AxiosError);
        setErrorState({
          error: apiError.message,
          isError: true,
          errorDetails: apiError,
        });
      } else {
        // Handle regular Error
        setErrorState({
          error: error.message,
          isError: true,
          errorDetails: undefined,
        });
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorDetails: undefined,
    });
  }, []);

  const handleAsyncError = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      clearError();
      return await asyncFn();
    } catch (error) {
      setError(error as Error);
      return null;
    }
  }, [setError, clearError]);

  return {
    ...errorState,
    setError,
    clearError,
    handleAsyncError,
  };
};

export default useErrorHandler;