import React, { useState } from 'react';
// DEPRECATED: ApplicantForm fue eliminado
// import { ApplicantForm } from '@compartido/ui/moleculas';
type ApplicantForm = any; // Placeholder
import { POSITIONS_WITH_COMPANY } from '@compartido/lib';
import type { NewApplicantFormData } from '@compartido/tipos';

interface Applicant extends NewApplicantFormData {
  id: string;
}

interface EditApplicantFormProps {
  applicant?: Applicant;
}

const EditApplicantForm: React.FC<EditApplicantFormProps> = ({ applicant }) => {
  const [formData, setFormData] = useState<NewApplicantFormData>(
    applicant || {
      nombres: '',
      apellidos: '',
      phoneMobile: '',
      documentNumber: '',
      documentType: 'DNI',
      positionOfInterest: '',
      company: '',
      campaign: '',
    }
  );

  const [disabledFields, setDisabledFields] = useState<Set<string>>(
    new Set(applicant ? ['documentNumber', 'documentType'] : [])
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (disabledFields.has(name)) {
      return;
    }

    // Sanitizar números en phoneMobile y documentNumber
    let sanitizedValue = value;
    if (name === 'phoneMobile' || name === 'documentNumber') {
      sanitizedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: sanitizedValue,
      };

      // Auto-set company if position requires it
      if (name === 'positionOfInterest' && POSITIONS_WITH_COMPANY.includes(sanitizedValue)) {
        updatedData.company = '';
      }

      return updatedData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updated applicant data:', formData);
    // Handle form submission
  };

  return (
    <ApplicantForm
      formData={formData}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      isEditing={true}
      disabledFields={disabledFields}
    />
  );
};

export default EditApplicantForm;
