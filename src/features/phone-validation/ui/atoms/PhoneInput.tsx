/**
 * Atom: Input básico para números telefónicos
 * Componente puro, sin lógica de negocio
 * 
 * Regla FSD: Componentes UI son puros (solo reciben props)
 */

import React from 'react';
import styles from './PhoneInput.module.css';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string | null;
  helperText?: string;
  placeholder?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, helperText, placeholder, className, ...rest }, ref) => {
    return (
      <div className={styles.container}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          type="tel"
          placeholder={placeholder || '+1 (555) 000-0000'}
          className={[
            styles.input,
            error ? styles.inputError : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {error && <span className={styles.error}>{error}</span>}
        {helperText && !error && (
          <span className={styles.helperText}>{helperText}</span>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
