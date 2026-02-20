import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import type { LoginFormData } from './LoginForm';
import { login } from '../services';
import './LoginForm.css';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await login(data);
      // Por ahora hacemos console.log del resultado (reemplazar por manejo real de sesión)
      console.log('Login exitoso:', res);
      alert(`Login OK - token: ${res.token}`);
    } catch (err: any) {
      setError(err?.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div style={{ width: 360 }}>
        <LoginForm onSubmit={handleSubmit} loading={loading} />
        {error && <div style={{ color: 'var(--danger, #d9534f)', marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
};
