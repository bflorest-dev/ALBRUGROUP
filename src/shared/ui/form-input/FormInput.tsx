/**
 * Componente FormInput reutilizable
 * FSD: shared/ui/form-input
 */

import React from 'react';
import styles from './FormInput.module.css';

interface FormInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'number' | 'tel' | 'password';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  pattern?: string;
  helpText?: string;
  className?: string;
}

/**
 * Input de formulario con validación y error message
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      type = 'text',
      placeholder,
      required = false,
      disabled = false,
      error,
      maxLength,
      pattern,
      helpText,
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

        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          pattern={pattern}
          required={required}
          className={`${styles.input} ${error ? styles.inputError : ''} ${
            disabled ? styles.inputDisabled : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        />

        {error && (
          <p id={`${name}-error`} className={styles.error}>
            {error}
          </p>
        )}

        {helpText && !error && (
          <p id={`${name}-help`} className={styles.helpText}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
