/**
 * Componente Toast - Notificaciones minimalistas
 */

import { useEffect } from 'react';
import { BiCheckCircle, BiXCircle, BiInfoCircle } from 'react-icons/bi';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast = ({ id, message, type, duration = 3000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <BiCheckCircle size={20} />;
      case 'error':
        return <BiXCircle size={20} />;
      case 'info':
        return <BiInfoCircle size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
};
