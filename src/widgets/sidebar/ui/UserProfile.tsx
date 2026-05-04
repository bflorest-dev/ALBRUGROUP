import React from 'react';
import type { UserProfile } from '@shared/types';

interface UserProfileProps {
  user: UserProfile;
}

export const UserProfileComponent: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-profile-component">
      <div className="avatar">{user.avatar || user.name?.[0] || '?'}</div>
      <div>
        <div className="name">{user.name}</div>
        <div className="role">{user.role}</div>
      </div>
    </div>
  );
};
