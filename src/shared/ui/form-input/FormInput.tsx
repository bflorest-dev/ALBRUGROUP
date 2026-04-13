/**
 * @atom FormInput — Shared genérico
 * Extensible por cualquier feature. No agregar props específicas de dominio.
 * Tipos soportados: text, email, number, tel, password, date
 * Para nuevos tipos, extender el union type en la interfaz de props.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

type InputType = 'text' | 'email' | 'number' | 'tel' | 'password' | 'date' | 'textarea';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: InputType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  className?: string;
  rows?: number; // Para textarea
}

/**
 * FormInput — Input genérico con validación y error message
 * Usa tokens de diseño del sistema (brand, surface, status)
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
      hint,
      maxLength,
      minLength,
      pattern,
      className,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const showHint = hint && !error;
    const isTextarea = type === 'textarea';

    const baseInputClasses = `
      w-full border rounded-input bg-white px-3.5 py-2.5
      text-sm text-gray-900 placeholder:text-gray-400
      transition-all duration-150 ease-out
      focus:outline-none focus:ring-0
      disabled:bg-surface-input disabled:text-gray-400 disabled:cursor-not-allowed
    `;

    const focusClasses = error
      ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]'
      : 'border-surface-border focus:border-brand-500 focus:shadow-focus';

    const inputClasses = `${baseInputClasses} ${focusClasses} ${className || ''}`;

    return (
      <div className="flex flex-col gap-1.5 mb-5">
        {/* Label */}
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        {/* Input or Textarea */}
        {isTextarea ? (
          <textarea
            ref={ref as any}
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            minLength={minLength}
            required={required}
            rows={rows}
            className={`${inputClasses} resize-y min-h-[100px]`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : showHint ? `${name}-hint` : undefined}
            {...(props as any)}
          />
        ) : (
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
            minLength={minLength}
            pattern={pattern}
            required={required}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : showHint ? `${name}-hint` : undefined}
            {...props}
          />
        )}

        {/* Error Message */}
        {error && (
          <p
            id={`${name}-error`}
            className="text-xs mt-0.5 text-red-500 flex items-center gap-1 animate-slide-down"
          >
            <AlertCircle size={12} className="flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Helper / Hint Text */}
        {showHint && (
          <p id={`${name}-hint`} className="text-xs mt-0.5 text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
