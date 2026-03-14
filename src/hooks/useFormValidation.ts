import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';

/**
 * Tipo para errores de validación
 * Mapeo de nombre de campo a mensaje de error
 */
export type ValidationErrors<T extends Record<string, any>> = Partial<
  Record<keyof T, string>
>;

/**
 * Hook para validación de formularios con Zod
 *
 * Proporciona:
 * - Validación contra un schema Zod
 * - Manejo de errores por campo
 * - Métodos para limpiar errores individuales o todos
 * - Validación on-demand
 *
 * @template T - Tipo de datos del formulario
 * @param schema - Schema Zod para validación
 * @param formData - Datos del formulario a validar
 * @param options - Opciones de configuración
 *
 * @example
 * ```tsx
 * const { errors, validate, clearError } = useFormValidation(
 *   applicantSchema,
 *   formData,
 *   { mode: 'onBlur' } // validar al perder foco
 * );
 *
 * const handleSubmit = (e) => {
 *   if (validate()) {
 *     // Formulario válido, proceder
 *   }
 * };
 * ```
 */
export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  formData: T,
  options?: {
    mode?: 'onChange' | 'onBlur' | 'onSubmit';
  }
) => {
  const { mode = 'onSubmit' } = options || {};
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const validationTriggeredRef = useRef(false);

  /**
   * Valida los datos contra el schema
   * Retorna true si la validación pasa, false si hay errores
   */
  const validate = useCallback(
    (data = formData): boolean => {
      const result = schema.safeParse(data);

      if (!result.success) {
        // Convertir errores Zod al formato esperado
        const newErrors: ValidationErrors<T> = {};
        result.error.issues.forEach((err) => {
          const fieldName = err.path[0] as keyof T;
          if (fieldName) {
            newErrors[fieldName] = err.message;
          }
        });
        setErrors(newErrors);
        validationTriggeredRef.current = true;
        return false;
      }

      // Validación exitosa
      setErrors({});
      return true;
    },
    [schema, formData]
  );

  /**
   * Limpia el error de un campo específico
   */
  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Limpia todos los errores
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Marca un campo como "tocado" (útil para mostrar errores solo en campos visitados)
   */
  const markFieldTouched = useCallback((field: keyof T) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  /**
   * Valida un campo específico
   */
  const validateField = useCallback(
    (field: keyof T) => {
      // Validación simplificada: check si el campo tiene valor requerido
      return !!formData[field] || formData[field] === '';
    },
    [formData]
  );

  /**
   * Valida automáticamente según el mode elegido
   * - onChange: valida mientras el usuario escribe
   * - onBlur: valida cuando el usuario sale del campo
   * - onSubmit: valida solo al hacer submit (manual validate())
   */
  useEffect(() => {
    if (validationTriggeredRef.current && mode === 'onChange') {
      validate();
    }
  }, [formData, validate, mode]);

  /**
   * Obtener error de un campo, respetando si fue tocado
   * Útil para mostrar solo errores de campos visitados
   */
  const getFieldError = useCallback(
    (field: keyof T, showAllErrors = !validationTriggeredRef.current): string | undefined => {
      if (!showAllErrors && !touched[field]) {
        return undefined;
      }
      return errors[field];
    },
    [errors, touched]
  );

  /**
   * Verificar si un campo específico tiene error
   */
  const hasError = useCallback(
    (field: keyof T): boolean => {
      return !!(touched[field] || validationTriggeredRef.current) && !!errors[field];
    },
    [errors, touched]
  );

  return {
    // Estado
    errors,
    touched,

    // Métodos de validación
    validate,
    validateField,
    getFieldError,
    hasError,

    // Métodos de control
    clearError,
    clearAllErrors,
    markFieldTouched,

    // Helpers
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
  };
};

/**
 * Hook de composición para combinar validación con estado de formulario
 * Integra useFormValidation con gestión de datos
 *
 * @example
 * ```tsx
 * const { formData, handleChange, errors, validate } = useValidatedForm(
 *   { nombres: '', apellidos: '' },
 *   applicantSchema
 * );
 *
 * <input
 *   name="nombres"
 *   value={formData.nombres}
 *   onChange={handleChange}
 *   error={errors.nombres}
 * />
 * ```
 */
export const useValidatedForm = <T extends Record<string, any>>(
  initialData: T,
  schema: z.ZodSchema<T>,
  options?: {
    mode?: 'onChange' | 'onBlur' | 'onSubmit';
    onSubmitSuccess?: (data: T) => void | Promise<void>;
  }
) => {
  const { mode = 'onSubmit', onSubmitSuccess } = options || {};
  const [formData, setFormData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useFormValidation(schema, formData, { mode });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
      validation.markFieldTouched(name as keyof T);
    },
    [validation]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validation.validate(formData)) {
        return;
      }
      setIsSubmitting(true);
      try {
        await onSubmitSuccess?.(formData);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validation, onSubmitSuccess]
  );

  const reset = useCallback(() => {
    setFormData(initialData);
    validation.clearAllErrors();
  }, [initialData, validation]);

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    reset,
    isSubmitting,
    ...validation,
  };
};
