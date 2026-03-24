/**
 * Componente NewApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { NewApplicantFormData } from '@types';
import { ApplicantForm } from '@molecules/ApplicantForm';
import { POSITIONS_WITH_COMPANY } from '@compartido/lib';
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
    company: '', // start empty so placeholder shows
    campaign: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'nombres' || name === 'apellidos') {
      const alphabeticValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: alphabeticValue }));
    } else if (name === 'phoneMobile') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'documentNumber') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => {
        const maxLength = prev.documentType === 'DNI' ? 8 : 9;
        return { ...prev, [name]: numericValue.slice(0, maxLength) };
      });
    } else if (name === 'positionOfInterest') {
      setFormData(prev => {
        const next: NewApplicantFormData = { ...prev, positionOfInterest: value };
        if (!POSITIONS_WITH_COMPANY.includes(value)) {
          next.company = '';
        }
        // no default company when switching into a company-requiring role;
        // user must select explicitly so placeholder remains.
        return next;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const needsCompany = POSITIONS_WITH_COMPANY.includes(formData.positionOfInterest);
    if (
      formData.nombres.trim() &&
      formData.apellidos.trim() &&
      formData.phoneMobile.trim() &&
      formData.documentNumber.trim() &&
      formData.positionOfInterest.trim() &&
      formData.campaign.trim() &&
      (!needsCompany || formData.company?.trim())
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