import React, { useState } from 'react';
import { BiPhoneCall } from 'react-icons/bi';
import './LoginForm.css';

export interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormProps {
  initial?: Partial<LoginFormData>;
  onSubmit: (data: LoginFormData) => void;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ initial = {}, onSubmit, loading = false }) => {
  const [username, setUsername] = useState(initial.username || '');
  const [password, setPassword] = useState(initial.password || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return;
    }
    onSubmit({ username, password });
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-brand">
        <h2>Iniciar sesión</h2>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="username">Usuario</label>
        <input
          id="username"
          className="form-input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="nombre de usuario"
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">Contraseña</label>
        <input
          id="password"
          className="form-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="tu contraseña"
          disabled={loading}
          required
        />
      </div>

      <div className="form-actions">
        <button 
          className="primary-btn" 
          type="submit" 
          disabled={loading || !username.trim() || !password.trim()} 
          aria-disabled={loading}
        >
          <span className="call-icon" aria-hidden="true"><BiPhoneCall /></span>
          <span className="btn-text">{loading ? 'Conectando…' : 'Ingresar'}</span>
        </button>
      </div>
    </form>
  );
};
