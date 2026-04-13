/**
 * @atom SelectInput — Shared genérico
 * Select reutilizable por cualquier feature.
 * Soporta placeholder (como option vacía disabled).
 * Validación con error inline.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectInputProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helpText?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string; // Si definido, primera option es disabled + vacía
  className?: string;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      options,
      error,
      helpText,
      disabled = false,
      required = false,
      placeholder,
      className,
      ...props
    },
    ref
  ) => {
    const borderClass = error
      ? 'border-red-500 dark:border-red-400'
      : 'border-gray-300 dark:border-gray-600';

    const bgClass = 'bg-white dark:bg-gray-800';
    const textClass = 'text-gray-900 dark:text-gray-100';
    const placeholderClass = 'placeholder-gray-500 dark:placeholder-gray-400';

    return (
      <div className={`flex flex-col gap-1 ${className || ''}`}>
        {label && (
          <label
            htmlFor={name}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
            ${bgClass} ${textClass} ${borderClass} ${placeholderClass}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {helpText && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
        )}
      </div>
    );
  }
);

SelectInput.displayName = 'SelectInput';
