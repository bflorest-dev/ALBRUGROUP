import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, className = '', error, ...rest }) => {
  const cls = `atom-input ${error ? 'error' : ''} ${className}`.trim();
  return (
    <>
      {label && (
        <label className="atom-input-label" htmlFor={rest.id as string}>
          {label}
        </label>
      )}
      <input className={cls} {...rest} />
    </>
  );
};

export default Input;
