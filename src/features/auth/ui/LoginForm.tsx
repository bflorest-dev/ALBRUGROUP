import React, { useState } from 'react';
import type { LoginFormData } from '../model/login.model';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void> | void;
  username?: string;
  onBack?: () => void;
  onForgotPassword?: () => void;
  loading?: boolean;
  error?: string | null;
}


export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  username: propUsername, 
  loading: propLoading = false, 
  error: propError,
  onBack,
  onForgotPassword 
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: propUsername || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza el username si cambia la prop
  React.useEffect(() => {
    if (typeof propUsername === 'string' && propUsername !== formData.username) {
      setFormData((prev) => ({ ...prev, username: propUsername }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: LoginFormData) => ({ ...prev, [name]: value as LoginFormData[keyof LoginFormData] }));
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

  return (
    <form onSubmit={handleSubmit} id="formularioDeLogin" className="space-y-4">
      <h2 className="text-3xl font-bold text-center">Iniciar sesión</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="font-semibold">
          USERNAME
        </label>
        <input
          type="username"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
          placeholder="Ingresa tu username"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="font-semibold">
          CONTRASEÑA
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
          placeholder="Ingresa tu contraseña"
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
};
