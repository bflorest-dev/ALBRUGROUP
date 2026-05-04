/**
 * Componentes de utilidad: Alert, Error, Spinner, Badge
 * FSD: shared/ui/
 */

import React from 'react';
import { DsBadge, DsButton } from '@shared/ui/design-system';
import styles from './Utilities.module.css';

// ========== ALERT ==========

interface AlertProps {
  type?: 'error' | 'success' | 'info' | 'warning';
  variant?: 'error' | 'success' | 'info' | 'warning';
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  variant,
  message,
  children,
  onClose,
  dismissible = true,
  className,
}) => {
  const alertType = variant ?? type;
  const content = children ?? message ?? '';

  return (
    <div className={`${styles.alert} ${styles[`alert-${alertType}`]} ${className || ''}`}>
      <div className={styles.alertContent}>{content}</div>
      {dismissible && onClose && (
        <button className={styles.alertClose} onClick={onClose} aria-label="Cerrar alerta">
          ✕
        </button>
      )}
    </div>
  );
};

// ========== LOADING SPINNER ==========

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  text,
  className,
}) => {
  return (
    <div className={`${styles.spinnerContainer} ${styles[`spinner-${size}`]} ${className || ''}`}>
      <div className={styles.spinner} />
      {text && <p className={styles.spinnerText}>{text}</p>}
    </div>
  );
};

// ========== BADGE ==========

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium';
  className?: string;
}

const badgeVariantMap = {
  primary: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
} as const;

const badgeSizeMap = {
  small: 'sm',
  medium: 'md',
} as const;

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  className,
}) => {
  return <DsBadge label={label} variant={badgeVariantMap[variant]} size={badgeSizeMap[size]} className={className} />;
};

// ========== ERROR MESSAGE ==========

interface ErrorMessageProps {
  message: string;
  details?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  details,
  className,
}) => {
  return (
    <div className={`${styles.errorMessage} ${className || ''}`}>
      <strong>{message}</strong>
      {details && <p>{details}</p>}
    </div>
  );
};

// ========== BUTTON ESTADOS ==========

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const buttonVariantMap = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
  success: 'success',
} as const;

const buttonSizeMap = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      isLoading = false,
      icon,
      fullWidth = false,
      disabled = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DsButton
        ref={ref}
        variant={buttonVariantMap[variant]}
        size={buttonSizeMap[size]}
        fullWidth={fullWidth}
        isLoading={isLoading}
        disabled={disabled}
        className={className}
        {...props}
      >
        {isLoading ? 'Cargando...' : (<>{icon && <span className={styles.iconSlot}>{icon}</span>}{children}</>)}
      </DsButton>
    );
  }
);

Button.displayName = 'Button';

// ========== TEXT AREA ==========

interface TextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  className?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      placeholder,
      rows = 4,
      required = false,
      disabled = false,
      error,
      maxLength,
      className,
    },
    ref
  ) => {
    return (
      <div className={`${styles.fieldContainer} ${className || ''}`}>
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>

        <textarea
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          required={required}
          className={`${styles.textarea} ${error ? styles.textareaError : ''} ${
            disabled ? styles.textareaDisabled : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />

        {error && (
          <p id={`${name}-error`} className={styles.error}>
            {error}
          </p>
        )}

        {maxLength && (
          <p className={styles.charCount}>
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
