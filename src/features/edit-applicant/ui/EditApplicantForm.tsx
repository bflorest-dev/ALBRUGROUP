import React, { useState } from 'react';
import { ApplicantForm } from '@shared/ui';
import { POSITIONS_WITH_COMPANY } from '@shared/lib';
import type { NewApplicantFormData } from '@shared/types';

interface Applicant extends NewApplicantFormData {
  id: string;
}

export interface EditApplicantFormProps {
  applicant?: Applicant;
}

const EditApplicantForm: React.FC<EditApplicantFormProps> = ({ applicant }) => {
  const [formData, setFormData] = useState<NewApplicantFormData>(
    applicant || {
      nombres: '',
      apellidos: '',
      phoneMobile: '',
      documentNumber: '',
      documentType: 'DNI',
      positionOfInterest: '',
      company: '',
      campaign: '',
    },
  );

  const [disabledFields] = useState<Set<string>>(
    new Set(applicant ? ['documentNumber', 'documentType'] : []),
  );

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    if (disabledFields.has(name)) {
      return;
    }

    let sanitizedValue = value;
    if (name === 'phoneMobile' || name === 'documentNumber') {
      sanitizedValue = value.replace(/\D/g, '');
    }

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: sanitizedValue,
      };

      if (name === 'positionOfInterest' && POSITIONS_WITH_COMPANY.includes(sanitizedValue)) {
        updatedData.company = '';
      }

      return updatedData;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Updated applicant data:', formData);
  };

  return (
    <ApplicantForm>
      <form onSubmit={handleSubmit} className="community-form community-form-spaced">
        <div className="community-grid-2">
          <div className="community-field">
            <label>Nombres</label>
            <input name="nombres" value={formData.nombres ?? ''} onChange={handleInputChange} />
          </div>
          <div className="community-field">
            <label>Apellidos</label>
            <input name="apellidos" value={formData.apellidos ?? ''} onChange={handleInputChange} />
          </div>
        </div>

        <div className="community-grid-2">
          <div className="community-field">
            <label>Tel�fono m�vil</label>
            <input name="phoneMobile" value={formData.phoneMobile ?? ''} onChange={handleInputChange} />
          </div>
          <div className="community-field">
            <label>Documento</label>
            <input
              name="documentNumber"
              value={formData.documentNumber ?? ''}
              onChange={handleInputChange}
              disabled={disabledFields.has('documentNumber')}
            />
          </div>
        </div>

        <div className="community-grid-2">
          <div className="community-field">
            <label>Tipo documento</label>
            <select
              name="documentType"
              value={formData.documentType ?? 'DNI'}
              onChange={handleInputChange}
              disabled={disabledFields.has('documentType')}
            >
              <option value="DNI">DNI</option>
              <option value="CE">CE</option>
            </select>
          </div>
          <div className="community-field">
            <label>Puesto</label>
            <input
              name="positionOfInterest"
              value={formData.positionOfInterest ?? ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="community-field">
          <label>Compa��a</label>
          <input name="company" value={formData.company ?? ''} onChange={handleInputChange} />
        </div>

        <div className="community-actions">
          <button type="submit" className="community-btn primary">Guardar cambios</button>
        </div>
      </form>
    </ApplicantForm>
  );
};

export default EditApplicantForm;
