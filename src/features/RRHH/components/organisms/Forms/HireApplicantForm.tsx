/**
 * Componente HireApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { HireApplicantFormData, Applicant } from '../../../../../types';
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
    phoneFixed: '',
    phoneMobile: applicant?.phoneMobile || '',
    phoneWork: '',
    bank: '',
    accountNumber: '',
    interbankNumber: '',
    baseSalary: '',
    role: applicant?.positionOfInterest || '',
    startDate: '',
    modality: applicant?.modality || '',
    scheduleType: '',
    googleEmail: '',
    personalEmail: '',
    applicantId: applicant?.id || '',
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
        <button type="submit" className="btn-hire">Contratar</button>
      </div>
    </form>
  );
};