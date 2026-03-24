import React, { useState } from 'react';
// DEPRECATED: ApplicantForm fue eliminado
// import { ApplicantForm } from '@compartido/ui/moleculas';
type ApplicantForm = any; // Placeholder
import { POSITIONS_WITH_COMPANY } from '@compartido/lib';
import type { NewApplicantFormData } from '@compartido/tipos';

const NewApplicantForm: React.FC = () => {
  const [formData, setFormData] = useState<NewApplicantFormData>({
    nombres: '',
    apellidos: '',
    phoneMobile: '',
    documentNumber: '',
    documentType: 'DNI',
    positionOfInterest: '',
    company: '',
    campaign: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

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
    console.log('Applicant data:', formData);
    // Handle form submission
  };

  return (
    <ApplicantForm
      formData={formData}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      isEditing={false}
    />
  );
};

export default NewApplicantForm;
