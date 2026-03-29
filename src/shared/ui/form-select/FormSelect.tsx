/**
 * Componente FormSelect reutilizable
 * FSD: shared/ui/form-select
 */

import React from 'react';
import styles from './FormSelect.module.css';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  helpText?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Select dropdown con opciones y validación
 */
export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      options,
      required = false,
      disabled = false,
      error,
      placeholder,
      helpText,
      isLoading = false,
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

        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || isLoading}
            required={required}
            className={`${styles.select} ${error ? styles.selectError : ''} ${
              disabled || isLoading ? styles.selectDisabled : ''
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={`${option.value}`}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {isLoading && <span className={styles.spinner} />}
        </div>

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

FormSelect.displayName = 'FormSelect';

export default FormSelect;
