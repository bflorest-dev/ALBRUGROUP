/**
 * Componente ActivateEmployeeModal - Modal para activar empleado
 */

import { useState } from 'react';
import { Modal } from '../../molecules/Modal';
import { AVAILABLE_POSITIONS } from '../../../utils/mockData';
import type { Employee } from '../../../types';
import './ActivateEmployeeModal.css';

interface ActivateEmployeeModalProps {
  isOpen: boolean;
  employee?: Employee | null;
  onConfirm: (startDate: string, position: string) => void;
  onCancel: () => void;
}

export const ActivateEmployeeModal = ({
  isOpen,
  employee,
  onConfirm,
  onCancel,
}: ActivateEmployeeModalProps) => {
  const [startDate, setStartDate] = useState(employee?.startDate || '');
  const [position, setPosition] = useState(employee?.position || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!startDate.trim()) {
      newErrors.startDate = 'La fecha de ingreso es requerida';
    }
    if (!position.trim()) {
      newErrors.position = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onConfirm(startDate, position);
      setStartDate('');
      setPosition('');
      setErrors({});
    }
  };

  const handleCancel = () => {
    setStartDate(employee?.startDate || '');
    setPosition(employee?.position || '');
    setErrors({});
    onCancel();
  };

  if (!isOpen || !employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Activar Empleado">
      <div className="activate-employee-form">
        <p className="activate-employee-subtitle">
          Actualizando datos para: <strong>{employee.fullName}</strong>
        </p>

        <div className="form-group">
          <label htmlFor="startDate" className="form-label">
            Fecha de Ingreso
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (errors.startDate) {
                setErrors({ ...errors, startDate: '' });
              }
            }}
            className={`form-input ${errors.startDate ? 'error' : ''}`}
          />
          {errors.startDate && (
            <span className="error-message">{errors.startDate}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="position" className="form-label">
            Rol/Posición
          </label>
          <select
            id="position"
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              if (errors.position) {
                setErrors({ ...errors, position: '' });
              }
            }}
            className={`form-input ${errors.position ? 'error' : ''}`}
          >
            <option value="">Seleccionar rol</option>
            {AVAILABLE_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
          {errors.position && (
            <span className="error-message">{errors.position}</span>
          )}
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            Activar Empleado
          </button>
        </div>
      </div>
    </Modal>
  );
};
