import React, { useEffect, useState } from 'react';
import type { LoginFormData } from '../model/login.model';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void> | void;
  username?: string;
  onBack?: () => void;
  onForgotPassword?: () => void;
  loading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  username,
  onBack,
  onForgotPassword,
  loading: externalLoading = false,
  error: externalError,
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setFormData((prev) => ({ ...prev, email: username }));
  }, [username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError('No se pudo iniciar sesión. Verifica tus credenciales.');
      console.error('Login submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || externalLoading;
  const shownError = externalError || error;

  return (
    <form onSubmit={handleSubmit} id="formularioDeLogin" className="login-form">
      <div className="form-section">
        <h2>Iniciar sesión</h2>
        <p className="form-description">Ingresa tus credenciales para continuar.</p>

        <div className="form-group">
          <label htmlFor="email">Usuario</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly={Boolean(username)}
            required
            className={username ? 'readonly-input' : undefined}
            placeholder="usuario@empresa.com"
            autoComplete="username"
          />
          {username && <small className="hint">✓ Usuario validado</small>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
          />
        </div>

        {shownError && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{shownError}</span>
          </div>
        )}

        {onForgotPassword && (
          <button
            type="button"
            className="btn-link"
            onClick={onForgotPassword}
            disabled={isSubmitting}
          >
            Olvidé mi contraseña
          </button>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-loader"></span>
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>

          {onBack && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Volver
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
