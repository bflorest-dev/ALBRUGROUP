import React from 'react';
import './Alert.css';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  message: string;
  type?: AlertType;
  onClose?: () => void;
}

const ICONS: Record<AlertType, string> = {
  success: '✔️',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

export const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`molecule-alert alert-${type}`} role="alert">
      <span className="alert-icon" aria-hidden>{ICONS[type]}</span>
      <span className="alert-message">{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Cerrar alerta">×</button>
      )}
    </div>
  );
};

export default Alert;
