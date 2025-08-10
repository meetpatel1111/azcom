import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

interface LogoutButtonProps {
  className?: string;
  variant?: 'button' | 'link';
  showIcon?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  variant = 'button',
  showIcon = true 
}) => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const baseClasses = variant === 'button' 
    ? 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'inline-flex items-center text-sm text-gray-700 hover:text-red-600 focus:outline-none focus:text-red-600';

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${baseClasses} ${className}`}
    >
      {isLoggingOut ? (
        <>
          <LoadingSpinner size="small" className="mr-2" />
          Signing out...
        </>
      ) : (
        <>
          {showIcon && (
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          )}
          Sign out
        </>
      )}
    </button>
  );
};

export default LogoutButton;