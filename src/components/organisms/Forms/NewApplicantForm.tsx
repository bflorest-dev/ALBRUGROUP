/**
 * Componente NewApplicantForm - Formulario para registrar postulante
 */

import { useState } from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../utils/mockData';
import type { NewApplicantFormData } from '../../../types';
import './NewApplicantForm.css';

interface NewApplicantFormProps {
  onSubmit: (formData: NewApplicantFormData) => void;
  onCancel: () => void;
}

export const NewApplicantForm = ({ onSubmit, onCancel }: NewApplicantFormProps) => {
  const [formData, setFormData] = useState<NewApplicantFormData>({
    fullName: '',
    phoneMobile: '',
    documentType: 'DNI',
    documentNumber: '',
    positionOfInterest: '',
    modality: 'PRESENCIAL',
    campaign: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validar nombre: solo letras y espacios
    if (name === 'fullName') {
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
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName.trim() && formData.phoneMobile.trim() && 
        formData.documentNumber.trim() && formData.positionOfInterest.trim() && 
        formData.modality.trim() && formData.campaign.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <form className="applicant-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="fullName">
          NOMBRES COMPLETOS <span className="required">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          placeholder="Ingrese nombres y apellidos"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
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
                    {category === 'RRHH' || category === 'CONTADOR' || category === 'COMMUNITY' 
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
          <label htmlFor="modality">MODALIDAD <span className="required">*</span></label>
          <select
            id="modality"
            name="modality"
            value={formData.modality}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar modalidad...</option>
            <option value="PART TIME">PART TIME</option>
            <option value="SEMI FULL">SEMI FULL</option>
            <option value="FULL TIME">FULL TIME</option>
            <option value="SUPER FULL">SUPER FULL</option>
          </select>
        </div>

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

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          CANCELAR
        </button>
        <button type="submit" className="btn-submit">
          + REGISTRAR POSTULANTE
        </button>
      </div>
    </form>
  );
};
