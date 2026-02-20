import React from 'react';
import './Select.css';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', error, ...rest }) => {
  const cls = `atom-select ${error ? 'error' : ''} ${className}`.trim();
  return (
    <>
      {label && (
        <label className="atom-select-label" htmlFor={rest.id as string}>
          {label}
        </label>
      )}
      <select className={cls} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </>
  );
};

export default Select;