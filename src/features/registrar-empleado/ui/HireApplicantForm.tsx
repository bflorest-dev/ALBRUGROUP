/**
 * Componente HireApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { HireApplicantFormData, Applicant } from '@shared/types';
import './HireApplicantForm.css';

interface HireApplicantFormProps {
  applicant: Applicant;
  onSubmit: (formData: HireApplicantFormData) => void;
  onCancel: () => void;
}

export const HireApplicantForm = ({ applicant, onSubmit, onCancel }: HireApplicantFormProps) => {
  const [formData] = useState<HireApplicantFormData>({
    nombres: applicant?.nombres || '',
    apellidos: applicant?.apellidos || '',
    documentType: 'DNI',
    documentNumber: applicant?.documentNumber || '',
    nationality: 'Peruana',
    birthDate: '',
    civilStatus: 'Soltero',
    hasChildren: false,
    district: '',
    address: '',
    phoneMobile: applicant?.phoneMobile || '',
    bank: '',
    accountNumber: '',
    interbankNumber: '',
    baseSalary: '',
    role: applicant?.positionOfInterest || '',
    puesto: applicant?.positionOfInterest || '',
    startDate: '',
    modality: applicant?.modality || '',
    scheduleType: '',
    personalEmail: '',
    applicantId: applicant?.id?.toString() || '',
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="hire-applicant-form" onSubmit={handleSubmit}>
      <div className="form-columns">{/* ... */}</div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-submit">Contratar</button>
      </div>
    </form>
  );
};

