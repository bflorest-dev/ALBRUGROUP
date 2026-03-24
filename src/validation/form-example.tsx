/**
 * Ejemplo: Componente de Formulario con Validación Zod
 * 
 * Demuestra cómo integrar validateData() en un formulario React
 * Proporciona validación en tiempo real + validación al enviar
 */

import { useState } from 'react';
import { validateData, NewApplicantFormDataSchema, type NewApplicantFormDataType } from '../validation/schemas';
import { ApplicantService } from '@caracteristicas/registrar-postulante/api';

interface FormErrors {
  [key: string]: string;
}

interface FormState extends Partial<NewApplicantFormDataType> {
  [key: string]: any;
}

/**
 * Componente de ejemplo: Crear Postulante con Validación Integrada
 * 
 * Características:
 * - Validación en tiempo real mientras se escribe
 * - Validación completa antes de enviar
 * - Mensajes de error formateados
 * - Estado de carga
 * - Integración con ApplicantService
 */
export function CreateApplicantFormExample() {
  const [formData, setFormData] = useState<FormState>({
    nombres: '',
    apellidos: '',
    documentType: 'DNI',
    documentNumber: '',
    phoneMobile: '',
    positionOfInterest: '',
    company: '',
    campaign: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Manejar cambios en los inputs
   * Valida en tiempo real para dar feedback inmediato
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Actualizar estado
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);

    // Validar en tiempo real
    const validationResult = validateData(
      NewApplicantFormDataSchema,
      newFormData
    );

    if (!validationResult.success) {
      // Type-safe access to errors (discriminated union narrowing)
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: validationResult.errors?.[name] || '',
      }));
    } else {
      // Si el campo ahora es válido, remover su error
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Manejar envío del formulario
   * Validar completo antes de enviar al servidor
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación completa
    const validationResult = validateData(
      NewApplicantFormDataSchema,
      formData
    );

    if (!validationResult.success) {
      // Type-safe access to errors (discriminated union narrowing)
      setErrors(validationResult.errors);
      console.error('Validation errors:', validationResult.errors);
      return;
    }

    // Si llegamos aquí, los datos son válidos
    try {
      setLoading(true);
      setSuccess(false);

      // Llamar al servicio con datos validados
      const result = await ApplicantService.createApplicant(validationResult.data);

      // Éxito
      console.log('Applicant created:', result);
      setSuccess(true);
      setFormData({
        nombres: '',
        apellidos: '',
        documentType: 'DNI',
        documentNumber: '',
        phoneMobile: '',
        positionOfInterest: '',
        company: '',
        campaign: '',
      });
      setErrors({});

      // Mostrar mensaje de éxito por 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      // Error del servidor
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Error desconocido al crear postulante' });
      }
      console.error('Error creating applicant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Crear Nuevo Postulante</h2>

      {success && (
        <div className="alert alert-success">
          ✅ Postulante creado exitosamente
        </div>
      )}

      {errors.submit && (
        <div className="alert alert-error">
          ❌ {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="applicant-form">
        {/* Nombres */}
        <div className="form-group">
          <label htmlFor="nombres">Nombres *</label>
          <input
            id="nombres"
            type="text"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            className={errors.nombres ? 'input-error' : ''}
            placeholder="Ingresa los nombres"
          />
          {errors.nombres && (
            <span className="error-message">{errors.nombres}</span>
          )}
        </div>

        {/* Apellidos */}
        <div className="form-group">
          <label htmlFor="apellidos">Apellidos *</label>
          <input
            id="apellidos"
            type="text"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            className={errors.apellidos ? 'input-error' : ''}
            placeholder="Ingresa los apellidos"
          />
          {errors.apellidos && (
            <span className="error-message">{errors.apellidos}</span>
          )}
        </div>

        {/* Tipo de Documento */}
        <div className="form-group">
          <label htmlFor="documentType">Tipo de Documento *</label>
          <select
            id="documentType"
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
            className={errors.documentType ? 'input-error' : ''}
          >
            <option value="DNI">DNI</option>
            <option value="CE">Carné de Extranjería</option>
          </select>
          {errors.documentType && (
            <span className="error-message">{errors.documentType}</span>
          )}
        </div>

        {/* Número de Documento */}
        <div className="form-group">
          <label htmlFor="documentNumber">Número de Documento *</label>
          <input
            id="documentNumber"
            type="text"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleChange}
            className={errors.documentNumber ? 'input-error' : ''}
            placeholder="Ej: 12345678"
          />
          {errors.documentNumber && (
            <span className="error-message">{errors.documentNumber}</span>
          )}
        </div>

        {/* Teléfono Móvil */}
        <div className="form-group">
          <label htmlFor="phoneMobile">Celular *</label>
          <input
            id="phoneMobile"
            type="tel"
            name="phoneMobile"
            value={formData.phoneMobile}
            onChange={handleChange}
            className={errors.phoneMobile ? 'input-error' : ''}
            placeholder="Ej: +51 999999999"
          />
          {errors.phoneMobile && (
            <span className="error-message">{errors.phoneMobile}</span>
          )}
        </div>

        {/* Posición de Interés */}
        <div className="form-group">
          <label htmlFor="positionOfInterest">Posición de Interés *</label>
          <input
            id="positionOfInterest"
            type="text"
            name="positionOfInterest"
            value={formData.positionOfInterest}
            onChange={handleChange}
            className={errors.positionOfInterest ? 'input-error' : ''}
            placeholder="Ej: Desarrollador Senior"
          />
          {errors.positionOfInterest && (
            <span className="error-message">{errors.positionOfInterest}</span>
          )}
        </div>

        {/* Compañía (Opcional) */}
        <div className="form-group">
          <label htmlFor="company">Compañía</label>
          <input
            id="company"
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className={errors.company ? 'input-error' : ''}
            placeholder="Ej: TechCorp"
          />
          {errors.company && (
            <span className="error-message">{errors.company}</span>
          )}
        </div>

        {/* Campaña */}
        <div className="form-group">
          <label htmlFor="campaign">Campaña/Origen *</label>
          <input
            id="campaign"
            type="text"
            name="campaign"
            value={formData.campaign}
            onChange={handleChange}
            className={errors.campaign ? 'input-error' : ''}
            placeholder="Ej: LinkedIn"
          />
          {errors.campaign && (
            <span className="error-message">{errors.campaign}</span>
          )}
        </div>

        {/* Botones */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || Object.keys(errors).length > 0}
            className="btn btn-primary"
          >
            {loading ? '⏳ Creando...' : '✅ Crear Postulante'}
          </button>
          <button
            type="reset"
            onClick={() => {
              setFormData({
                nombres: '',
                apellidos: '',
                documentType: 'DNI',
                documentNumber: '',
                phoneMobile: '',
                positionOfInterest: '',
                company: '',
                campaign: '',
              });
              setErrors({});
            }}
            className="btn btn-secondary"
          >
            🔄 Limpiar
          </button>
        </div>
      </form>

      {/* CSS (Add to your stylesheet) */}
      <style>{`
        .form-container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .form-group {
          margin-bottom: 15px;
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .input-error {
          border-color: #dc3545 !important;
          background-color: #f8f9fa;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .alert-success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .alert-error {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #5a6268;
        }
      `}</style>
    </div>
  );
}

/**
 * CÓMO USAR ESTE COMPONENTE:
 * 
 * 1. Impórtalo en tu aplicación:
 *    import { CreateApplicantFormExample } from './examples/form-with-validation';
 * 
 * 2. Úsalo en tu componente padre:
 *    <CreateApplicantFormExample />
 * 
 * 3. El formulario automaticamente:
 *    - Valida en tiempo real mientras escribes
 *    - Muestra errores específicos por campo
 *    - Deshabilita el botón si hay errores
 *    - Envía datos validados al servicio
 *    - Maneja errores del servidor
 * 
 * PUNTOS CLAVE:
 * ✅ validateData() se usa para validación interactiva (con safeParse)
 * ✅ Los errores se muestran en tiempo real
 * ✅ Antes de enviar, se hace validación completa
 * ✅ El servicio recibe datos garantizadamente válidos
 * ✅ Los tipos están completamente sincronizados con el esquema Zod
 */
