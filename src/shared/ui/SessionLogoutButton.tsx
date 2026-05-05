import React from 'react';
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

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
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
