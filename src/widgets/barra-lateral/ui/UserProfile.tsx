/**
 * Componente UserProfile - Widget Header
 */

import React from 'react';

export const UserProfile: React.FC = () => {
  return (
    <div className="user-profile">
      <span>User</span>
    </div>
  );
};

// Alias para compatibilidad
export const UserProfileComponent = UserProfile;

export default UserProfile;
