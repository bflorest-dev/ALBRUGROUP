/**
 * Componente EditApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../../../utils/mockData';
import type { EditApplicantFormData, Applicant } from '../../../../../types';
import './EditApplicantForm.css';

interface EditApplicantFormProps {
  applicant: Applicant;
  onSubmit: (formData: EditApplicantFormData) => void;
  onCancel: () => void;
}

export const EditApplicantForm = ({ applicant, onSubmit, onCancel }: EditApplicantFormProps) => {
  const [formData, setFormData] = useState<EditApplicantFormData>({
    id: applicant.id,
    nombres: applicant.nombres || '',
    apellidos: applicant.apellidos || '',
    phoneMobile: applicant.phoneMobile || '',
    documentType: (applicant.documentType as 'DNI' | 'CE') || 'DNI',
    documentNumber: applicant.documentNumber || '',
    positionOfInterest: applicant.positionOfInterest || '',
    company: (applicant as any).compania || 'CLARO',
    campaign: applicant.campaign || '',
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
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nombres">NOMBRES <span className="required">*</span></label>
          <input
            type="text"
            id="nombres"
            name="nombres"
            placeholder="Nombres"
            value={formData.nombres}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="apellidos">APELLIDOS <span className="required">*</span></label>
          <input
            type="text"
            id="apellidos"
            name="apellidos"
            placeholder="Apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phoneMobile">CELULAR PERSONAL <span className="required">*</span></label>
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
          <label htmlFor="positionOfInterest">PUESTO DE INTERÉS <span className="required">*</span></label>
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
          <label htmlFor="documentNumber">Nº DOCUMENTO <span className="required">*</span></label>
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
          <label htmlFor="campaign">CAMPAÑA <span className="required">*</span></label>
          <select
            id="campaign"
            name="campaign"
            value={formData.campaign}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una campaña</option>
            <option value="COMPUTRABAJO">COMPUTRABAJO</option>
            <option value="INDEED">INDEED</option>
            <option value="REFERIDO">REFERIDO</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="company">COMPAÑÍA <span className="required">*</span></label>
          <select id="company" name="company" value={formData.company} onChange={handleChange} required className={`company-select ${formData.company.toLowerCase()}`}>
            <option value="CLARO">CLARO</option>
            <option value="WIN">WIN</option>
          </select>
        </div>
      </div>


      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>CANCELAR</button>
        <button type="submit" className="btn-submit">GUARDAR CAMBIOS</button>
      </div>
    </form>
  );
};