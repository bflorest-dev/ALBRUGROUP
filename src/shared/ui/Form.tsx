import React, { FormEvent, ReactNode } from 'react';

interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
}

interface FormProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
  title?: string;
  error?: string;
}

/**
 * Componente de formulario genérico reutilizable
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
}) => {
  return (
    <form onSubmit={onSubmit} className="form">
      {title && <h4>{title}</h4>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        {fields.map((field) => (
          <div key={field.name} className="mb-3">
            <label htmlFor={field.name} className="form-label">
              {field.label} {field.required && <span className="text-danger">*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="form-control"
                required={field.required}
              >
                <option value="">Selecciona una opción</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <input
                id={field.name}
                type="checkbox"
                name={field.name}
                checked={values[field.name] || false}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="form-check-input"
              />
            ) : field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="form-control"
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
              />
            ) : (
              <input
                id={field.name}
                type={field.type || 'text'}
                name={field.name}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="form-control"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Cargando...' : submitLabel}
      </button>
    </form>
  );
};
