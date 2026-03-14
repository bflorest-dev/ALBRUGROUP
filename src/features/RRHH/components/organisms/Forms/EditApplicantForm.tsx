/**
 * Componente EditApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { EditApplicantFormData, Applicant } from '@types';
import { ApplicantForm } from '@molecules/ApplicantForm';
import { POSITIONS_WITH_COMPANY } from '@utils/constants';
import './EditApplicantForm.css';

interface EditApplicantFormProps {
  applicant: Applicant;
  onSubmit: (formData: EditApplicantFormData) => void;
  onCancel: () => void;
  disabledFields?: Array<keyof EditApplicantFormData>;
}

export const EditApplicantForm = ({ applicant, onSubmit, onCancel, disabledFields }: EditApplicantFormProps) => {
  const [formData, setFormData] = useState<EditApplicantFormData>({
    id: applicant.id,
    nombres: applicant.nombres || '',
    apellidos: applicant.apellidos || '',
    phoneMobile: applicant.phoneMobile || '',
    documentType: (applicant.documentType as 'DNI' | 'CE') || 'DNI',
    documentNumber: applicant.documentNumber || '',
    positionOfInterest: applicant.positionOfInterest || '',
    company: applicant.company || 'CLARO',
    campaign: applicant.campaign || '',
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
        const next: EditApplicantFormData = { ...prev, positionOfInterest: value };
        if (!POSITIONS_WITH_COMPANY.includes(value)) {
          next.company = '';
        } else if (!next.company) {
          next.company = 'CLARO';
        }
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
      submitLabel="GUARDAR CAMBIOS"
      disabledFields={disabledFields?.filter((field) => field !== 'id') as Array<keyof Omit<EditApplicantFormData, 'id'>>}
    />
  );
};