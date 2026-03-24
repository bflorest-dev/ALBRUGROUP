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
      phone: '',
      doc: '',
      docType: 'DNI',
      posicion: '',
      empresa: '',
      campaign: '',
    }
  );

  const [disabledFields, setDisabledFields] = useState<Set<string>>(
    new Set(applicant ? ['doc', 'docType'] : [])
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (disabledFields.has(name)) {
      return;
    }

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
