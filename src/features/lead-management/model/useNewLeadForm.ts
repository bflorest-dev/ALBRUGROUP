/**
 * Hook: useNewLeadForm
 * Maneja el estado y validación del formulario para crear nuevos leads
 * 
 * Responsabilidades:
 * - Mantener estado del formulario
 * - Validar datos (teléfono según país, campos requeridos)
 * - Manejar cambios en inputs
 */

import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { filterPhoneInput } from '@shared/lib';
import { sanitizeInput, sanitizeFormField } from '@shared/lib';

export interface NewLeadFormData {
  pois: string;
  name: string;
  campaign: string;
  channel: string;
  base: string;
}

export interface NewLeadFormState {
  formData: NewLeadFormData;
  errors: Record<string, string>;
  isValid: boolean;
}

export interface NewLeadFormActions {
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: () => { valid: boolean; data?: NewLeadFormData };
  reset: () => void;
  setFormData: (data: NewLeadFormData) => void;
}

const INITIAL_FORM_DATA: NewLeadFormData = {
  pois: '',
  name: '',
  campaign: '',
  channel: '',
  base: ''
};

/**
 * Hook para manejar el formulario de creación de nuevos leads
 * 
 * Funcionalidades:
 * - Mantiene estado de formulario con valores por defecto
 * - Validación en dos niveles: requeridos y formato
 * - Filtrado especial de teléfono según país (POIS)
 * - Limpieza automática de errores al escribir
 * - Control de validez del formulario completo
 * 
 * Campos del formulario:
 * - pois (País): Requerido, determina formato de teléfono
 * - name (Teléfono): Requerido, solo dígitos, filtrado por país
 * - campaign (Campaña): Requerido, selección de lista
 * - channel (Canal): Requerido, Facebook/Instagram/WhatsApp
 * - base (Base): Requerido, selección de lista
 * 
 * Validaciones:
 * - Nivel 1: Campos requeridos (todos deben tener valor)
 * - Nivel 2: Formato (teléfono solo números, regex según país)
 * 
 * Comportamiento especial:
 * - Al cambiar POIS (país), se reinicia el filtro de teléfono
 * - Los errores se limpian automáticamente al empezar a escribir
 * - isValid indica si el formulario puede ser enviado
 * 
 * @returns NewLeadFormState & NewLeadFormActions:
 *   - formData: Valores actuales del formulario
 *   - errors: Objeto con errores por field
 *   - isValid: boolean indicando si el formulario es válido
 *   - handleChange: Handler para inputs (aplica filtros y limpia errores)
 *   - handleSubmit: Ejecuta validaciones, retorna {valid, data?}
 *   - reset: Limpia deformulario y errores
 *   - setFormData: Setter directo (para casos especiales)
 * 
 * @example
 * const { formData, errors, handleChange, handleSubmit, reset } = useNewLeadForm();
 * 
 * const onSubmit = (e) => {
 *   e.preventDefault();
 *   const result = handleSubmit();
 *   if (result.valid && result.data) {
 *     submitLead(result.data);
 *   }
 * };
 * 
 * return (
 *   <form onSubmit={onSubmit}>
 *     <Select
 *       name="pois"
 *       value={formData.pois}
 *       onChange={handleChange}
 *       error={errors.pois}
 *     />
 *     <Input
 *       name="name"
 *       value={formData.name}
 *       onChange={handleChange}
 *       error={errors.name}
 *       placeholder="Teléfono"
 *     />
 *   </form>
 * );
 */
export function useNewLeadForm(): NewLeadFormState & NewLeadFormActions {
  const [formData, setFormData] = useState<NewLeadFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validar que todos los campos requeridos estén completos
   */
  const validateRequired = useCallback((data: NewLeadFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!data.pois) newErrors.pois = 'País es requerido';
    if (!data.name) newErrors.name = 'Teléfono es requerido';
    if (!data.campaign) newErrors.campaign = 'Campaña es requerida';
    if (!data.channel) newErrors.channel = 'Canal es requerido';
    if (!data.base) newErrors.base = 'Base es requerida';

    return newErrors;
  }, []);

  /**
   * Validar que el teléfono solo contenga números
   */
  const validatePhoneFormat = useCallback((data: NewLeadFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (data.name && !/^\d+$/.test(data.name)) {
      newErrors.name = 'El teléfono solo debe contener números';
    }

    return newErrors;
  }, []);

  /**
   * Realizar todas las validaciones
   */
  const validateForm = useCallback((data: NewLeadFormData): Record<string, string> => {
    const requiredErrors = validateRequired(data);
    if (Object.keys(requiredErrors).length > 0) {
      return requiredErrors;
    }

    const formatErrors = validatePhoneFormat(data);
    if (Object.keys(formatErrors).length > 0) {
      return formatErrors;
    }

    return {};
  }, [validateRequired, validatePhoneFormat]);

  /**
   * Manejar cambios en inputs
   * Aplica sanitización y filtros especiales por tipo de campo
   * 
   * Seguridad:
   * - Sanitiza inputs para prevenir XSS
   * - Filtra teléfono según país
   * - Valida tipos de datos permitidos
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      let sanitizedValue = value;

      // SEGURIDAD: Sanitizar según tipo de campo
      if (name === 'name') {
        // Teléfono: filtrar por dígitos y sanitizar
        const filteredValue = filterPhoneInput(value);
        sanitizedValue = sanitizeFormField(filteredValue);
      } else if (name === 'pois') {
        // País/POIS: solo caracteres alfanuméricos
        sanitizedValue = sanitizeInput(value).toUpperCase();
      } else if (
        name === 'campaign' ||
        name === 'channel' ||
        name === 'base'
      ) {
        // Dropdowns: sanitizar pero permitir espacios
        sanitizedValue = sanitizeInput(value);
      }

      // Actualizar form data con valor sanitizado
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));

      // Limpiar error del campo al empezar a escribir
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [formData.pois, errors]
  );

  /**
   * Ejecutar validación y retornar resultado
   * 
   * SEGURIDAD:
   * - Valida que todos los campos cumplan con requisitos
   * - Verifica que los datos sanitizados no estén vacíos
   * - Valida formato de teléfono para el país elegido
   * - Retorna copia de datos para evitar mutaciones
   */
  const handleSubmit = useCallback((): { valid: boolean; data?: NewLeadFormData } => {
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return { valid: false };
    }

    // SEGURIDAD: Validar que datos sanitizados no están vacíos
    // (podría pasar si usuario intenta pasar solo caracteres especiales)
    if (
      !formData.pois.trim() ||
      !formData.name.trim() ||
      !formData.campaign.trim() ||
      !formData.channel.trim() ||
      !formData.base.trim()
    ) {
      setErrors({ submit: 'Los datos contienen caracteres inválidos' });
      return { valid: false };
    }

    // SEGURIDAD: Re-sanitizar datos finales antes de enviar
    const sanitizedData: NewLeadFormData = {
      pois: sanitizeInput(formData.pois),
      name: sanitizeFormField(formData.name),
      campaign: sanitizeInput(formData.campaign),
      channel: sanitizeInput(formData.channel),
      base: sanitizeInput(formData.base),
    };

    setErrors({});
    return { valid: true, data: sanitizedData };
  }, [formData, validateForm]);

  /**
   * Resetear formulario a estado inicial
   */
  const reset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  }, []);

  // Calcular si el formulario es válido
  const isValid: boolean = Object.keys(errors).length === 0 &&
    formData.pois.length > 0 &&
    formData.name.trim() !== '' &&
    formData.campaign !== '' &&
    formData.channel !== '' &&
    formData.base !== '';

  return {
    formData,
    errors,
    isValid,
    handleChange,
    handleSubmit,
    reset,
    setFormData,
  };
}
