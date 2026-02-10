/**
 * Context para Notificaciones Global
 */

import { createContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface NotificationContextType {
  toasts: ToastMessage[];
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  removeToast: (id: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    const toast: ToastMessage = { id, message, type };
    
    setToasts((prev) => [...prev, toast]);

    if (type !== 'error') {
      setTimeout(() => {
        removeToast(id);
      }, 3000);
    } else {
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string) => {
    addToast(message, 'success');
  }, [addToast]);

  const showError = useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  const showInfo = useCallback((message: string) => {
    addToast(message, 'info');
  }, [addToast]);

  const value: NotificationContextType = {
    toasts,
    showSuccess,
    showError,
    showInfo,
    removeToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
