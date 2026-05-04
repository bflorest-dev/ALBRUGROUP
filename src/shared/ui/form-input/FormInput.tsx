/**
 * @atom FormInput — Shared genérico
 * Extensible por cualquier feature. No agregar props específicas de dominio.
 * Tipos soportados: text, email, number, tel, password, date, textarea
 * Para nuevos tipos, extender el union type en la interfaz de props.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

type InputType = 'text' | 'email' | 'number' | 'tel' | 'password' | 'date';
type TextareaType = 'textarea';

interface BaseFormInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  helpText?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  className?: string;
}

interface InputProps extends BaseFormInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | keyof BaseFormInputProps> {
  type?: InputType;
  rows?: never;
}

interface TextareaProps extends BaseFormInputProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'type' | 'value' | keyof BaseFormInputProps> {
  type: TextareaType;
  rows?: number;
}

type FormInputProps = InputProps | TextareaProps;

/**
 * Type guard para verificar si es textarea
 */
function isTextareaProps(props: FormInputProps): props is TextareaProps {
  return props.type === 'textarea';
}

/**
 * FormInput — Input genérico con validación y error message
 * Usa tokens de diseño del sistema (brand, surface, status)
 */
export const FormInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, FormInputProps>(
  (props, ref) => {
    const {
      label,
      name,
      value,
      onChange,
      placeholder,
      required = false,
      disabled = false,
      error,
      hint,
      helpText,
      maxLength,
      minLength,
      pattern,
      className,
      ...restProps
    } = props;

    const resolvedHint = hint ?? helpText;
    const showHint = resolvedHint && !error;

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

    if (isTextareaProps(props)) {
      const { rows = 4, ...textareaRest } = restProps as Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseFormInputProps>;

      return (
        <div className="flex flex-col gap-1.5 mb-5">
          {/* Label */}
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {/* Textarea */}
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
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
            {...textareaRest}
          />

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
              {resolvedHint}
            </p>
          )}
        </div>
      );
    }

    const { type = 'text', ...inputRest } = restProps as Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseFormInputProps>;

    return (
      <div className="flex flex-col gap-1.5 mb-5">
        {/* Label */}
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        {/* Input */}
        <input
          ref={ref as React.Ref<HTMLInputElement>}
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
          {...inputRest}
        />

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
            {resolvedHint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
