import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { clearSession, getStoredToken } from '@shared/api/httpClient';

interface SessionLogoutButtonProps {
  className?: string;
  label?: string;
}

export const SessionLogoutButton: React.FC<SessionLogoutButtonProps> = ({
  className,
  label = 'Cerrar sesión',
}) => {
  const navigate = useNavigate();
  const isAuthenticated = !!getStoredToken();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <button
      type='button'
      className={`session-logout-button ${className ?? ''}`.trim()}
      onClick={handleLogout}
      title={label}
    >
      <LogOut size={15} aria-hidden='true' />
      <span>{label}</span>
    </button>
  );
};
