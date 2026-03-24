/**
 * Componente UserProfile - Widget Header
 */

import React from 'react';

interface UserProfileProps {
  user?: any;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-profile">
      <span>{user?.name || 'User'}</span>
    </div>
  );
};

// Alias para compatibilidad
export const UserProfileComponent = UserProfile;

export default UserProfile;
