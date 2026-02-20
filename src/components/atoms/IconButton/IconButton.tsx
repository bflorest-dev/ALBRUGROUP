import React from 'react';
import './IconButton.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'primary';
  size?: 'sm' | 'md';
  'aria-label': string;
}

export const IconButton = ({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...rest
}: IconButtonProps) => {
  const cls = `atom-icon-button ${variant} ${size} ${className}`.trim();
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
};

export default IconButton;
