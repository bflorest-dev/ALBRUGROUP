import React, { useState } from 'react';
import { BiPhoneCall } from 'react-icons/bi';
import './LoginForm.css';

export interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  initial?: Partial<LoginFormData>;
  onSubmit: (data: LoginFormData) => void;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ initial = {}, onSubmit, loading = false }) => {
  const [email, setEmail] = useState(initial.email || '');
  const [password, setPassword] = useState(initial.password || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-brand">
        <h2>Iniciar sesión</h2>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          className="form-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          required
        />
      </div>

      <div className="form-actions">
        <button className="primary-btn" type="submit" disabled={loading} aria-disabled={loading}>
          <span className="call-icon" aria-hidden="true"><BiPhoneCall /></span>
          <span className="btn-text">{loading ? 'Conectando…' : 'Ingresar'}</span>
        </button>
      </div>
    </form>
  );
};
