/**
 * Componente EditApplicantForm - Formulario para editar postulante
 */

import { useState } from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../utils/mockData';
import type { EditApplicantFormData, Applicant } from '../../../types';
import './EditApplicantForm.css';

interface EditApplicantFormProps {
  applicant: Applicant;
  onSubmit: (formData: EditApplicantFormData) => void;
  onCancel: () => void;
}

export const EditApplicantForm = ({ applicant, onSubmit, onCancel }: EditApplicantFormProps) => {
  const [formData, setFormData] = useState<EditApplicantFormData>({
    id: applicant.id,
    nombres: '',
    apellidos: '',
    phoneMobile: applicant.phoneMobile || '',
    documentType: (applicant.documentType as 'DNI' | 'CE') || 'DNI',
    documentNumber: applicant.documentNumber || '',
    positionOfInterest: applicant.positionOfInterest || '',
    campaign: applicant.campaign || '',
    trainingDayPayment: applicant.trainingDayPayment || undefined,
    startDate: applicant.startDate || '',
    endDate: applicant.endDate || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validar nombres: solo letras y espacios
    if (name === 'nombres' || name === 'apellidos') {
      const alphabeticValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: alphabeticValue,
      }));
    }
    // Validar celular: solo números y máximo 9 dígitos
    else if (name === 'phoneMobile') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    }
    // Validar documento: solo números, 8 para DNI y 9 para CE
    else if (name === 'documentNumber') {
      const numericValue = value.replace(/\D/g, '');
      const maxLength = formData.documentType === 'DNI' ? 8 : 9;
      const slicedValue = numericValue.slice(0, maxLength);
      setFormData((prev) => ({
        ...prev,
        [name]: slicedValue,
      }));
    }
    // Validar pago de capacitación: solo números
    else if (name === 'trainingDayPayment') {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue ? parseFloat(numericValue) : undefined,
      }));
    }
    // Validar fechas
    else if (name === 'startDate' || name === 'endDate') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nombres">
            NOMBRES <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nombres"
            name="nombres"
            placeholder="Ingrese nombres"
            value={formData.nombres}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="apellidos">
            APELLIDOS <span className="required">*</span>
          </label>
          <input
            type="text"
            id="apellidos"
            name="apellidos"
            placeholder="Ingrese apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phoneMobile">
            CELULAR PERSONAL <span className="required">*</span>
          </label>
          <input
            type="tel"
            id="phoneMobile"
            name="phoneMobile"
            placeholder="Número de celular"
            value={formData.phoneMobile}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="positionOfInterest">
            PUESTO DE INTERÉS <span className="required">*</span>
          </label>
          <select
            id="positionOfInterest"
            name="positionOfInterest"
            value={formData.positionOfInterest}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un puesto</option>
            {Object.entries(AVAILABLE_POSITIONS_GROUPED).map(([category, positions]) => (
              <optgroup key={category} label={category}>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {category === 'RRHH' || category === 'CONTABILIDAD' || category === 'COMMUNITY' 
                      ? position 
                      : `  ${position}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="documentType">TIPO DE DOCUMENTO</label>
          <select
            id="documentType"
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
          >
            <option value="DNI">DNI</option>
            <option value="CE">CE</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="documentNumber">
            Nº DOCUMENTO <span className="required">*</span>
          </label>
          <input
            type="text"
            id="documentNumber"
            name="documentNumber"
            placeholder="Número de documento"
            value={formData.documentNumber}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="campaign">
            CAMPAÑA <span className="required">*</span>
          </label>
          <input
            type="text"
            id="campaign"
            name="campaign"
            placeholder="Nombre de la campaña"
            value={formData.campaign}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="trainingDayPayment">PAGO DEL DÍA DE CAPACITACIÓN</label>
          <input
            type="number"
            id="trainingDayPayment"
            name="trainingDayPayment"
            placeholder="Monto en S/."
            value={formData.trainingDayPayment ?? ''}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">FECHA INICIO</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate ?? ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">FECHA FIN</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate ?? ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          CANCELAR
        </button>
        <button type="submit" className="btn-submit">
          GUARDAR CAMBIOS
        </button>
      </div>
    </form>
  );
};
