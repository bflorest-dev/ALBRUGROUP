import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@entities/auth';
import { LoginForm } from '@features/auth/ui/LoginForm';
import type { LoginFormData } from '@features/auth/model';
import { DsSectionCard } from '@shared/ui/design-system';
import styles from './PaginaLogin.module.css';

const PaginaLogin: React.FC = () => {
  const [, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (formData: LoginFormData) => {
    setLoading(true);
    try {
      const user = await login(formData.username, formData.password);
      const isAdmin = user.roles?.includes('ADMINISTRADOR');
      navigate(isAdmin ? '/admin' : '/panel');
    } catch (error) {
      console.error('Login error:', error);
      alert('Credenciales inválidas o error de autenticación.');
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
        <LoginForm onSubmit={onSubmit} />
        </DsSectionCard>
      </div>
    </div>
  );
};

export default PaginaLogin;
