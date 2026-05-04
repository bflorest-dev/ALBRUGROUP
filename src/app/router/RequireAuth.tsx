import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@entities/auth';

interface RequireAuthProps {
  children: React.ReactElement;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const hasToken = !!localStorage.getItem('auth_token');

  if (!isAuthenticated || !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
