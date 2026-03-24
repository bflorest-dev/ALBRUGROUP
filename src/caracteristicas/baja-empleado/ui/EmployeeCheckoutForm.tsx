/**
 * Componente EmployeeCheckoutForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { Employee } from '@compartido/tipos';
import './EmployeeCheckoutForm.css';

interface EmployeeCheckoutFormProps {
  employee: Employee;
  onCancel: () => void;
  onSubmit: (checkoutDate: string, checkoutReason: string) => void;
}

export const EmployeeCheckoutForm = ({ employee, onCancel, onSubmit }: EmployeeCheckoutFormProps) => {
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkoutReason, setCheckoutReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!checkoutDate.trim()) newErrors.checkoutDate = 'La fecha de baja es requerida';
    if (!checkoutReason.trim()) newErrors.checkoutReason = 'El motivo de baja es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onSubmit(checkoutDate, checkoutReason);
      setCheckoutDate('');
      setCheckoutReason('');
      setErrors({});
    }
  };

  const handleCancel = () => {
    setCheckoutDate('');
    setCheckoutReason('');
    setErrors({});
    onCancel();
  };

  return (
    <div className="checkout-form">
      <p className="checkout-subtitle">Dando de baja a: <strong>{employee.fullName}</strong></p>
      <div className="form-group">
        <label className="form-label">Fecha de Baja</label>
        <input type="date" className={`form-input ${errors.checkoutDate ? 'error' : ''}`} value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} />
        {errors.checkoutDate && <span className="error-message">{errors.checkoutDate}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Motivo de Baja</label>
        <textarea className={`form-input textarea ${errors.checkoutReason ? 'error' : ''}`} rows={4} value={checkoutReason} onChange={(e) => setCheckoutReason(e.target.value)} />
        {errors.checkoutReason && <span className="error-message">{errors.checkoutReason}</span>}
      </div>
      <div className="form-actions">
        <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
        <button className="btn-confirm" onClick={handleConfirm}>Confirmar</button>
      </div>
    </div>
  );
};
