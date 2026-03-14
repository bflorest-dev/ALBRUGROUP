import { useMemo, useContext } from 'react';
import type { NotificationContextType } from '../NotificationContext';
import { NotificationContext } from '../NotificationContext';

/**
 * Problema #5: Context Optimization - Notification Selectors
 * 
 * These hooks provide fine-grained access to NotificationContext
 * avoiding re-renders when unneeded values change.
 * 
 * Example:
 *   // Instead of:
 *   const { toasts, showSuccess, removeToast } = useNotification();  // Re-renders on any change
 *   
 *   // Use:
 *   const toasts = useNotificationToasts();  // Only re-renders when toasts change
 *   const { showSuccess } = useNotificationActions();  // Never re-renders (functions stable)
 */

/**
 * Get the raw context (fallback if needed)
 */
const getNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('Notification hooks must be used within NotificationProvider');
  }
  return context;
};

/**
 * Get only the toasts array
 * Memoized to prevent re-renders when actions change
 * Dependencies: toasts array
 */
export const useNotificationToasts = () => {
  const context = getNotificationContext();
  return useMemo(() => context.toasts, [context.toasts]);
};

/**
 * Get only the notification action methods
 * Memoized: Functions are stable (already useCallback in provider)
 * So component never re-renders when toasts change
 * Dependencies: action functions
 */
export const useNotificationActions = () => {
  const context = getNotificationContext();
  return useMemo(
    () => ({
      showSuccess: context.showSuccess,
      showError: context.showError,
      showInfo: context.showInfo,
      removeToast: context.removeToast
    }),
    [context.showSuccess, context.showError, context.showInfo, context.removeToast]
  );
};

/**
 * Convenience: Get specific action without others
 * Use when you only need one notification type
 */
export const useShowSuccess = () => {
  const context = getNotificationContext();
  return useMemo(() => context.showSuccess, [context.showSuccess]);
};

export const useShowError = () => {
  const context = getNotificationContext();
  return useMemo(() => context.showError, [context.showError]);
};

export const useShowInfo = () => {
  const context = getNotificationContext();
  return useMemo(() => context.showInfo, [context.showInfo]);
};

/**
 * Get both toasts and actions (typical usage pattern)
 * Use when you need both read and write functionality
 * Dependencies: toasts + actions
 */
export const useNotification = () => {
  const toasts = useNotificationToasts();
  const actions = useNotificationActions();
  
  return useMemo(
    () => ({
      toasts,
      ...actions
    }),
    [toasts, actions]
  );
};
