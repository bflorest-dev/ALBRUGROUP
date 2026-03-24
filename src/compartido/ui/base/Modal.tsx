import React from 'react';

export interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * Modal stub component
 * Minimal functional implementation for type compatibility
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen = false,
  onClose,
  title,
  children,
  className = '',
  ...props
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`modal-backdrop ${className}`}
      role="presentation"
      onClick={onClose}
      {...props}
    >
      <div
        className="modal-content"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="modal-header">{title}</div>}
        <div className="modal-body">{children || 'Modal content'}</div>
        {onClose && (
          <div className="modal-footer">
            <button onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
