import React from 'react';
import '../../../styles/atoms.css';
import './HeaderActions.css';

interface HeaderActionsProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({ children, className = '', title }) => (
  <div className={`header-actions ${className}`}>{/* optional title */}
    {title && <h2 className="header-actions-title">{title}</h2>}
    {children}
  </div>
);

export default HeaderActions;
