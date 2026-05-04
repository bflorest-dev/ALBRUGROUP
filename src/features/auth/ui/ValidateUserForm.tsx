import React, { useState, useEffect } from 'react';

export interface ValidateUserFormProps {
  onValidate: (username: string) => Promise<void>;
  initialUsername?: string;
  loading?: boolean;
  error?: string;
}

/**
 * Paso 1: Validación de Usuario
 * 
 * INPUT: username
 * ACCIÓN: Llama GET /autorizacion/estado-acceso/{username}
 * DECISIÓN: Si passwordInicializada === true → LOGIN, else → RESET
 * 
 * FSD: caracteristicas/autenticacion/ui
 * Estilos: @shared/ui/styles/auth.css
 */
export const ValidateUserForm: React.FC<ValidateUserFormProps> = ({
  onValidate,
  initialUsername = '',
  loading = false,
  error,
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [validationError, setValidationError] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Autofocus en montaje
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Mantener username si se reingresa desde otro paso
  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!username.trim()) {
      setValidationError('El usuario es obligatorio');
      return;
    }

    if (username.length < 3) {
      setValidationError('El usuario debe tener al menos 3 caracteres');
      return;
    }

    try {
      await onValidate(username);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Error al validar usuario'
      );
    }
  };

  // Permitir envío con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && username.trim().length >= 3) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="validate-user-form">
      <div className="form-section">
        <h2>Bienvenido</h2>
        <p className="form-description">
          Ingresa tu usuario para continuar
        </p>

        {/* Username Input */}
        <div className="form-group">
          <label htmlFor="username">Usuario</label>
          <input
            ref={inputRef}
            type="text"
            id="username"
            value={username}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="tu.usuario"
            disabled={loading}
            required
            autoComplete="username"
          />
        </div>

        {/* Error Display */}
        {(validationError || error) && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="btn-primary"
        >
          {loading ? (
            <>
              <span className="btn-loader"></span>
              Validando...
            </>
          ) : (
            'Validar'
          )}
        </button>

        {/* Helper text */}
        <p className="form-description">
          Presiona Enter o haz clic en Validar
        </p>
      </div>
    </form>
  );
};
