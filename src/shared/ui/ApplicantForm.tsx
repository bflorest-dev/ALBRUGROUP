import React from 'react';

interface ApplicantFormProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const ApplicantForm: React.FC<ApplicantFormProps> = ({ 
  children, 
  className,
  ...htmlProps 
}) => (
  <div 
    className={`applicant-form ${className || ''}`}
    {...htmlProps}
  >
    {children}
  </div>
);
