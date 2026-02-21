/**
 * Componente NewApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { NewApplicantFormData } from '@types';
import { ApplicantForm } from '@molecules/ApplicantForm';
import './NewApplicantForm.css';

interface NewApplicantFormProps {
  onSubmit: (formData: NewApplicantFormData) => void;
  onCancel: () => void;
}

export const NewApplicantForm = ({ onSubmit, onCancel }: NewApplicantFormProps) => {
  const [formData, setFormData] = useState<NewApplicantFormData>({
    nombres: '',
    apellidos: '',
    phoneMobile: '',
    documentType: 'DNI',
    documentNumber: '',
    positionOfInterest: '',
    company: 'CLARO',
    campaign: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'nombres' || name === 'apellidos') {
      const alphabeticValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData((prev: NewApplicantFormData) => ({ ...prev, [name]: alphabeticValue }));
    } else if (name === 'phoneMobile') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev: NewApplicantFormData) => ({ ...prev, [name]: numericValue }));
    } else if (name === 'documentNumber') {
      const numericValue = value.replace(/\D/g, '');
      const maxLength = formData.documentType === 'DNI' ? 8 : 9;
      const slicedValue = numericValue.slice(0, maxLength);
      setFormData((prev: NewApplicantFormData) => ({ ...prev, [name]: slicedValue }));
    } else {
      setFormData((prev: NewApplicantFormData) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.nombres.trim() &&
      formData.apellidos.trim() &&
      formData.phoneMobile.trim() &&
      formData.documentNumber.trim() &&
      formData.positionOfInterest.trim() &&
      formData.campaign.trim() &&
      formData.company?.trim()
    ) {
      onSubmit(formData);
    }
  };

  return (
    <ApplicantForm
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="+ REGISTRAR POSTULANTE"
    />
  );
};