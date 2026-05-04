/**
 * Componente UserProfile - Perfil de usuario
 */

import type { UserProfile } from '@shared/types';
import './UserProfile.css';

interface UserProfileProps {
  user: UserProfile;
}

export const UserProfileComponent = ({ user }: UserProfileProps) => {
  return (
    <div className="user-profile">
      <div className="user-avatar">{user.avatar}</div>
      <div className="user-info">
        <p className="user-name">{user.name}</p>
        <p className="user-role">{user.role}</p>
      </div>
    </div>
  );
};

