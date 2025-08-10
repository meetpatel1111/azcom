import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
}

interface ErrorContextType {
  notifications: ErrorNotification[];
  showError: (message: string, options?: Partial<ErrorNotification>) => void;
  showWarning: (message: string, options?: Partial<ErrorNotification>) => void;
  showInfo: (message: string, options?: Partial<ErrorNotification>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addNotification = useCallback((
    message: string,
    type: 'error' | 'warning' | 'info',
    options: Partial<ErrorNotification> = {}
  ) => {
    const notification: ErrorNotification = {
      id: generateId(),
      message,
      type,
      duration: options.duration ?? (type === 'error' ? 5000 : 3000),
      persistent: options.persistent ?? false,
      ...options,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss non-persistent notifications
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, notification.duration);
    }
  }, []);

  const showError = useCallback((message: string, options?: Partial<ErrorNotification>) => {
    addNotification(message, 'error', options);
  }, [addNotification]);

  const showWarning = useCallback((message: string, options?: Partial<ErrorNotification>) => {
    addNotification(message, 'warning', options);
  }, [addNotification]);

  const showInfo = useCallback((message: string, options?: Partial<ErrorNotification>) => {
    addNotification(message, 'info', options);
  }, [addNotification]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: ErrorContextType = {
    notifications,
    showError,
    showWarning,
    showInfo,
    dismissNotification,
    clearAllNotifications,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;