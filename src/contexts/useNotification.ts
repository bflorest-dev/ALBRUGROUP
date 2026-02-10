/**
 * Hook useNotification
 */

import { useContext } from 'react';
import { NotificationContext } from './NotificationContext';

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de NotificationProvider');
  }
  return context;
};
