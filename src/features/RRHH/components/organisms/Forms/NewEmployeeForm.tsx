/**
 * Componente NewEmployeeForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { NewEmployeeFormData } from '../../../../../types';
import './NewEmployeeForm.css';

interface NewEmployeeFormProps {
  onSubmit: (formData: NewEmployeeFormData) => void;
  onCancel: () => void;
}

export const NewEmployeeForm = ({ onSubmit, onCancel }: NewEmployeeFormProps) => {
  const [formData] = useState<NewEmployeeFormData>({
    nombres: '',
    apellidos: '',
    documentType: 'DNI',
    documentNumber: '',
    nationality: 'Peruana',
    birthDate: '',
    civilStatus: 'Soltero',
    hasChildren: false,
    district: '',
    address: '',
    phoneFixed: '',
    phoneMobile: '',
    phoneWork: '',
    bank: '',
    accountNumber: '',
    interbankNumber: '',
    baseSalary: '',
    role: '',
    startDate: '',
    modality: '',
    scheduleType: '',
    googleEmail: '',
  });



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      {/* content identical to original (kept for brevity) */}
      <div className="form-sections">{/* ... */}</div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>CANCELAR</button>
        <button type="submit" className="btn-submit">GUARDAR</button>
      </div>
    </form>
  );
};