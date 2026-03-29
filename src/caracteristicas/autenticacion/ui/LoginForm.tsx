import React, { useState, useEffect } from 'react';
import { BiPhoneCall } from 'react-icons/bi';
import type { LoginFormData } from '../modelo';

interface LoginFormProps {
  username: string; // Readonly - prellenado del paso anterior
  onSubmit?: (data: LoginFormData) => Promise<void>;
  onBack: () => void;
  onForgotPassword: () => void;
  loading?: boolean;
  error?: string;
}

/**
 * Paso 2: Iniciar Sesión
 * 
 * INPUTS:
 * - username (readonly, prellenado desde VALIDATE_USER)
 * - password (required)
 * 
 * ACCIÓN: POSTa /autorizacion/login
 * RESULTADO: Obtiene token JWT, lo almacena y redirige a dashboard
 * 
 * FSD: caracteristicas/autenticacion/ui
 * Estilos: @shared/ui/styles/auth.css
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  username,
  onSubmit,
  onBack,
  onForgotPassword,
  loading = false,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  // Autofocus en password cuando se monta
  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!password.trim()) {
      setValidationError('La contraseña es obligatoria');
      return;
    }

    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const formData: LoginFormData = {
      username,
      password,
    };

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Error al iniciar sesión'
      );
    }
  };

  // Permitir envío con Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && password.trim().length >= 6) {
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-section">
        <h2>Bienvenido nuevamente</h2>
        <p className="form-description">
          Ingresa tu contraseña para acceder
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

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">
            Contraseña
            <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '4px', color: '#6b7280' }}>
              (mín. 6 caracteres)
            </span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              required
              autoComplete="current-password"
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-gray-500)',
                width: 'auto',
                height: 'auto',
              }}
              title={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(validationError || error) && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="btn-loader"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="btn-secondary"
          >
            Cambiar Usuario
          </button>
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading}
            className="btn-link"
            style={{ marginTop: '8px', fontSize: '0.9rem' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Contact Support */}
        <button
          type="button"
          onClick={() => console.log('Contactar soporte')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
          className="contact-support"
        >
          <BiPhoneCall size={16} />
          <span>Contactar soporte</span>
        </button>
      </div>
    </form>
  );
};
