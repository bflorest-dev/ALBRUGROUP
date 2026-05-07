import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@entities/auth';
import { LoginForm } from '@features/auth/ui/LoginForm';
import type { LoginFormData } from '@features/auth/model';
import { DsSectionCard } from '@shared/ui/design-system';
import styles from './PaginaLogin.module.css';

const PaginaLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (formData: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const user = await login(formData.email, formData.password);
      const isAdmin = user.roles.includes('ADMINISTRADOR');
      navigate(isAdmin ? '/admin' : '/panel');
    } catch (error) {
      console.error('Login error:', error);
      setError('Credenciales inválidas o error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <DsSectionCard
          title="Iniciar sesión"
          description="Accede a tu cuenta con tu email y contraseña"
          className={styles.loginPanel}
        >
          <LoginForm
            onSubmit={onSubmit}
            loading={loading}
            error={error || undefined}
          />
        </DsSectionCard>
      </div>
    </div>
  );
};

export default PaginaLogin;
