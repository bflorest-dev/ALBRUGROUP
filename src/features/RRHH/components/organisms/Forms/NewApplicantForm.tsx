/**
 * Componente NewApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../../../utils/mockData';
import type { NewApplicantFormData } from '../../../../../types';
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
    campaign: '',
    trainingDayPayment: undefined,
    startDate: '',
    endDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'nombres' || name === 'apellidos') {
      const alphabeticValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: alphabeticValue }));
    } else if (name === 'phoneMobile') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === 'documentNumber') {
      const numericValue = value.replace(/\D/g, '');
      const maxLength = formData.documentType === 'DNI' ? 8 : 9;
      const slicedValue = numericValue.slice(0, maxLength);
      setFormData((prev) => ({ ...prev, [name]: slicedValue }));
    } else if (name === 'trainingDayPayment') {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue ? parseFloat(numericValue) : undefined }));
    } else if (name === 'startDate' || name === 'endDate') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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
      <div className="form-row">{/* content omitted for brevity */}</div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>CANCELAR</button>
        <button type="submit" className="btn-submit">+ REGISTRAR POSTULANTE</button>
      </div>
    </form>
  );
};