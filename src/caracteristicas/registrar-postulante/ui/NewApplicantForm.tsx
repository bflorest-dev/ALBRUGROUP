import React, { useState } from 'react';
import { ApplicantForm } from '@compartido/ui/moleculas';
import { POSITIONS_WITH_COMPANY } from '@compartido/lib';
import type { NewApplicantFormData } from '@compartido/tipos';

const NewApplicantForm: React.FC = () => {
  const [formData, setFormData] = useState<NewApplicantFormData>({
    nombres: '',
    apellidos: '',
    phone: '',
    doc: '',
    docType: 'DNI',
    posicion: '',
    empresa: '',
    campaign: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Sanitizar números en phone y doc
    let sanitizedValue = value;
    if (name === 'phone' || name === 'doc') {
      sanitizedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: sanitizedValue,
      };

      // Auto-assign empresa based on posicion
      if (name === 'posicion') {
        const selectedPosition = POSITIONS_WITH_COMPANY.find(p => p.value === sanitizedValue);
        if (selectedPosition) {
          updatedData.empresa = selectedPosition.company;
        }
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
