import React from 'react';

export interface ApplicantFormProps {
  formData?: any;
  onInputChange?: (e: React.ChangeEvent<any>) => void;
  onSubmit?: (e: React.FormEvent) => void;
  isEditing?: boolean;
  disabledFields?: Set<string>;
  [key: string]: any;
}

/**
 * ApplicantForm - Molecule
 * 
 * Formulario para crear o editar un Aplicante/Candidato
 * Incluye campos personales, profesionales y de contacto
 */
export const ApplicantForm: React.FC<ApplicantFormProps> = ({
  formData = {},
  onInputChange,
  onSubmit,
  isEditing = false,
  disabledFields = new Set(),
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form onSubmit={handleSubmit} {...props}>
      <div className="applicant-form">
        <h3>{isEditing ? 'Edit Applicant' : 'New Applicant'}</h3>
        <p>Form data: {JSON.stringify(formData)}</p>
        <input
          type="text"
          placeholder="Form input"
          onChange={onInputChange}
          disabled={disabledFields?.has?.('placeholder')}
        />
        <button type="submit">Submit</button>
      </div>
    </form>
  );
};

export default ApplicantForm;
