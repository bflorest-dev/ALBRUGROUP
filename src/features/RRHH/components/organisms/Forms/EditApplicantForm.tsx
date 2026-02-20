/**
 * Componente EditApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { EditApplicantFormData, Applicant } from '../../../../../types';
import './EditApplicantForm.css';

interface EditApplicantFormProps {
  applicant: Applicant;
  onSubmit: (formData: EditApplicantFormData) => void;
  onCancel: () => void;
}

export const EditApplicantForm = ({ applicant, onSubmit, onCancel }: EditApplicantFormProps) => {
  const [formData] = useState<EditApplicantFormData>({
    id: applicant.id,
    nombres: applicant.nombres || '',
    apellidos: applicant.apellidos || '',
    phoneMobile: applicant.phoneMobile || '',
    documentType: (applicant.documentType as 'DNI' | 'CE') || 'DNI',
    documentNumber: applicant.documentNumber || '',
    positionOfInterest: applicant.positionOfInterest || '',
    company: (applicant as any).compania || 'CLARO',
    campaign: applicant.campaign || '',
    trainingDayPayment: applicant.trainingDayPayment || undefined,
    startDate: applicant.startDate || '',
    endDate: applicant.endDate || '',
  });



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombres.trim() && formData.apellidos.trim() && formData.phoneMobile.trim() && 
        formData.documentNumber.trim() && formData.positionOfInterest.trim() && 
        formData.campaign.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <form className="applicant-form" onSubmit={handleSubmit}>
      <div className="form-row">{/* ... */}</div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>CANCELAR</button>
        <button type="submit" className="btn-submit">GUARDAR CAMBIOS</button>
      </div>
    </form>
  );
};