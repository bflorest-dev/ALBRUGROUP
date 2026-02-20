import React from 'react';
import './Label.css';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ children, required, className = '', ...rest }) => {
  const cls = `atom-label ${className}`.trim();
  return (
    <label className={cls} {...rest}>
      {children} {required && <span className="required">*</span>}
    </label>
  );
};

export default Label;