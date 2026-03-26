import React from 'react';

interface ApplicantFormProps {
  [key: string]: any;
  children?: React.ReactNode;
}

export const ApplicantForm: React.FC<ApplicantFormProps> = ({ children, ...props }) => (
  <div className="applicant-form" {...props}>
    {children}
  </div>
);
