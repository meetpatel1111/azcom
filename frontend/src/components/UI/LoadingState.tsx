import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingText?: string;
  errorComponent?: React.ReactNode;
  spinnerSize?: 'sm' | 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  children,
  loadingText = 'Loading...',
  errorComponent,
  spinnerSize = 'medium',
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <LoadingSpinner size={spinnerSize} />
        {loadingText && (
          <p className="mt-4 text-sm text-gray-600">{loadingText}</p>
        )}
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md mx-auto">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingState;