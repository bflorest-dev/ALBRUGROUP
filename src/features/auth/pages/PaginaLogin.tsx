import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@entities/auth';
import { LoginForm } from '../ui/LoginForm';
import type { LoginFormData } from '../modelo/login.model';

const PaginaLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (formData: LoginFormData) => {
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-3xl font-bold mb-6 text-center">Iniciar sesión</h1>
        <p className="text-sm text-center mb-4">Accede a tu cuenta con tu email y contraseña</p>
        <LoginForm onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default PaginaLogin;
