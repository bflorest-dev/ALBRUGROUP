/**
 * Componente EmployeeDetailForm (moved to features/RRHH)
 */

import { useState } from 'react';

import type { Employee, EmployeeDetailFormData } from '@types';
import './EmployeeDetailForm.css';

interface EmployeeDetailFormProps {
  employee: Employee;
  onCancel: () => void;
  onSubmit?: (formData: EmployeeDetailFormData) => void;
  isEditMode?: boolean;
}

export const EmployeeDetailForm = ({ employee, onCancel, onSubmit, isEditMode = false }: EmployeeDetailFormProps) => {
  const [, setEditMode] = useState(isEditMode);
  const [formData] = useState<EmployeeDetailFormData>({
    nombres: employee.nombres || '',
    apellidos: employee.apellidos || '',
    documentType: employee.documentType || '',
    documentNumber: employee.documentNumber || '',
    nationality: employee.nationality || '',
    birthDate: employee.birthDate || '',
    civilStatus: employee.civilStatus || '',
    hasChildren: employee.hasChildren || false,
    district: employee.district || '',
    address: employee.address || '',
    phoneFixed: employee.phoneFixed || '',
    phoneMobile: employee.phoneMobile || '',
    phoneWork: employee.phoneWork || '',
    personalEmail: employee.personalEmail || '',
    bank: employee.bank || '',
    accountNumber: employee.accountNumber || '',
    interbankNumber: employee.interbankNumber || '',
    baseSalary: employee.baseSalary || '',
    startDate: employee.startDate || '',
    endDate: employee.endDate || '',
    modality: employee.modality || '',
    scheduleType: employee.scheduleType || '',
    googleEmail: employee.googleEmail || '',
    position: employee.position || '',
    department: employee.department || '',
    status: employee.status || 'ACTIVO',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    onCancel();
  };

  return (
    <form className="employee-detail-form" onSubmit={handleSubmit}>
      <div className="form-content">{/* content omitted for brevity */}</div>
      <div className="form-actions-detail">
        <button type="button" className="btn-cancel" onClick={handleCancel}>CANCELAR</button>
        <button type="submit" className="btn-submit">GUARDAR</button>
      </div>
    </form>
  );
};