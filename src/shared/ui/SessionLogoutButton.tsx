import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@entities/auth';

interface SessionLogoutButtonProps {
  className?: string;
  label?: string;
}

export const SessionLogoutButton: React.FC<SessionLogoutButtonProps> = ({
  className,
  label = 'Cerrar sesión',
}) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevenir múltiples clics
    
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[SessionLogoutButton] Error durante logout:', error);
      // Navegar al login incluso si hay error
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type='button'
      className={`session-logout-button ${className ?? ''}`.trim()}
      onClick={handleLogout}
      disabled={isLoggingOut}
      title={isLoggingOut ? 'Cerrando sesión...' : label}
    >
      <LogOut size={15} aria-hidden='true' />
      <span>{isLoggingOut ? 'Cerrando...' : label}</span>
    </button>
  );
};
