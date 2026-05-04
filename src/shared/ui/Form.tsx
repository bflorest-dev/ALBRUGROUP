/**
 * Form - Componente de formulario genérico mejorado
 * Usa componentes del Design System para consistencia
 */

import React, { FormEvent } from 'react';
import { FormField } from './form/FormField';
import { FormInput } from './form/FormInput';
import { FormSelect } from './form/FormSelect';
import { FormTextarea } from './form/FormTextarea';
import { Button } from './button/Button';
import { Alert } from './utilities/Utilities';

interface FormFieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  description?: string;
}

type FormValue = string | number | boolean;

interface FormProps {
  fields: FormFieldConfig[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onSubmit: (e: FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
  title?: string;
  error?: string;
  className?: string;
}

/**
 * Type guard para validar valores de formulario
 */
function isFormValue(value: unknown): value is FormValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Parsear valor según tipo de campo
 */
function parseFieldValue(value: string, type: FormFieldConfig['type']): FormValue {
  switch (type) {
    case 'number':
      return Number(value);
    case 'checkbox':
      return value === 'true' || value === 'on';
    default:
      return value;
  }
}

/**
 * Componente de formulario genérico reutilizable
 * Migrado al Design System con componentes consistentes
 */
export const Form: React.FC<FormProps> = ({
  fields,
  values,
  onChange,
  onSubmit,
  loading = false,
  submitLabel = 'Enviar',
  title,
  error,
  className,
}) => {
  const handleChange = (field: FormFieldConfig, rawValue: string | boolean) => {
    let typedValue: unknown = rawValue;

    // Convertir según tipo de campo
    if (typeof rawValue === 'string') {
      typedValue = parseFieldValue(rawValue, field.type);
    }

    // Validar antes de propagar
    if (isFormValue(typedValue)) {
      onChange(field.name, typedValue);
    } else {
      console.warn(`[Form] Invalid value for field ${field.name}:`, typedValue);
    }
  };

  const getFieldValue = (fieldName: string, fieldType: FormFieldConfig['type']): string | boolean => {
    const value = values[fieldName];

    if (fieldType === 'checkbox') {
      return typeof value === 'boolean' ? value : false;
    }

    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  };

  return (
    <form onSubmit={onSubmit} className={className}>
      {title && (
        <h4 className="text-lg font-semibold text-foreground mb-4">{title}</h4>
      )}
      
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {fields.map((field) => {
          const fieldValue = getFieldValue(field.name, field.type);

          return (
            <FormField
              key={field.name}
              label={field.label}
              required={field.required}
              description={field.description}
            >
              {field.type === 'select' ? (
                <FormSelect
                  name={field.name}
                  value={String(fieldValue)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  options={field.options || []}
                  placeholder="Selecciona una opción"
                  required={field.required}
                />
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <input
                    id={field.name}
                    type="checkbox"
                    name={field.name}
                    checked={fieldValue === true}
                    onChange={(e) => handleChange(field, e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <label htmlFor={field.name} className="text-sm text-foreground">
                    {field.placeholder || field.label}
                  </label>
                </div>
              ) : field.type === 'textarea' ? (
                <FormTextarea
                  name={field.name}
                  value={String(fieldValue)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={3}
                />
              ) : (
                <FormInput
                  name={field.name}
                  type={field.type || 'text'}
                  value={String(fieldValue)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
            </FormField>
          );
        })}
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
