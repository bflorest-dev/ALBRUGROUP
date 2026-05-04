/**
 * Componente HireApplicantForm (moved to features/RRHH)
 * Migrado al Design System - Quick Win
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import type { HireApplicantFormData, Applicant } from '@shared/types';
import { Button } from '@shared/ui/button';

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
    modality: (applicant as unknown as { modality?: string })?.modality || '',
    scheduleType: '',
    personalEmail: '',
    applicantId: applicant?.id?.toString() || '',
  });


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="hire-applicant-form" onSubmit={handleSubmit}>
      <div className="form-columns">{/* ... */}</div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Contratar
        </Button>
      </div>
    </form>
  );
};

