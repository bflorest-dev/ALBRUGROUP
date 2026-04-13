import React, { useState, useEffect } from 'react';
import type { ForgotPasswordResponse } from '@shared/types';

export interface ResetPasswordFormProps {
  username: string;
  onReset: (email: string, dni: string) => Promise<ForgotPasswordResponse>;
  onBack: () => void;
  onGoToLogin: () => void;
  loading?: boolean;
  error?: string;
  resetSuccess?: boolean;
  generatedPassword?: string;
}

/**
 * Paso 3: Reset de Contraseña - UI MEJORADA
 * 
 * INPUTS:
 * - username (readonly)
 * - email (validación RFC 5322)
 * - dni (7-10 dígitos)
 * 
 * FSD: caracteristicas/autenticacion/ui
 * Estilos: @shared/ui/styles/auth.css
 */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  username,
  onReset,
  onBack,
  onGoToLogin,
  loading = false,
  error,
  resetSuccess = false,
  generatedPassword,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    dni: '',
  });

  const [validationError, setValidationError] = useState('');
  const emailRef = React.useRef<HTMLInputElement>(null);

  // Autofocus en montaje
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationError('');
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidDNI = (dni: string): boolean => {
    return /^(\d{7,10})|(\d{1,3}-\d{1,3}-\d{1,3})$/.test(dni);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.email.trim()) {
      setValidationError('El email es obligatorio');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setValidationError('Email inválido. Ej: usuario@ejemplo.com');
      return;
    }

    if (!formData.dni.trim()) {
      setValidationError('El DNI es obligatorio');
      return;
    }

    if (!isValidDNI(formData.dni)) {
      setValidationError('DNI inválido (7-10 dígitos)');
      return;
    }

    try {
      await onReset(formData.email, formData.dni);
      // El estado de éxito lo maneja el padre mediante resetSuccess
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Error al resetear contraseña'
      );
    }
  };

  if (resetSuccess) {
    return (
      <div className="reset-password-form success-state">
        <div className="form-section" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ color: 'var(--color-success)', marginBottom: '8px' }}>
            Contraseña reseteada correctamente
          </h2>
          <p className="success-message">
            Tu contraseña ha sido configurada correctamente.
            <br />
            Elige cuándo quieres iniciar sesión.
          </p>
          {generatedPassword && (
            <p className="success-message" style={{ marginTop: '8px' }}>
              Contraseña provisional: <strong>{generatedPassword}</strong>
            </p>
          )}
          <div className="form-actions" style={{ justifyContent: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onGoToLogin}
              className="btn-primary"
            >
              Ir a iniciar sesión
            </button>
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
              style={{ marginLeft: '8px' }}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="reset-password-form">
      <div className="form-section">
        <h2>Configurar Contraseña</h2>
        <p className="form-description">
          Debes configurar tu contraseña antes de continuar
        </p>

        {/* Username (Readonly) */}
        <div className="form-group">
          <label htmlFor="username-readonly">Usuario</label>
          <input
            type="text"
            id="username-readonly"
            value={username}
            readOnly
            className="readonly-input"
          />
          <small className="hint">✓ Usuario validado</small>
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            ref={emailRef}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu.email@ejemplo.com"
            disabled={loading}
            required
            autoComplete="email"
          />
        </div>

        {/* DNI */}
        <div className="form-group">
          <label htmlFor="dni">DNI / Documento</label>
          <input
            type="text"
            id="dni"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            placeholder="12345678 o 12345-678-123"
            disabled={loading}
            required
          />
          <small className="hint">7-10 dígitos o formato con guiones</small>
        </div>

        {/* Error Display */}
        {(validationError || error) && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <span className="btn-loader"></span>
                Reseteando...
              </>
            ) : (
              'Resetear Contraseña'
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="btn-secondary"
          >
            Volver
          </button>
        </div>
      </div>
    </form>
  );
};
