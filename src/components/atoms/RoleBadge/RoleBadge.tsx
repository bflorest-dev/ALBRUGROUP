import React from 'react';
import type { RoleBadgeProps } from './RoleBadge.types';
import './RoleBadge.css';

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'medium' }) => {
  return (
    <span className={`role-badge role-badge--${size} role-badge--${role.toLowerCase()}`}>
      {role}
    </span>
  );
};

export default RoleBadge;