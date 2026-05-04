import React, { useState } from 'react';
import { ApplicantForm } from '@shared/ui/base';
import { Select } from '@shared/ui/input';
import { POSITIONS_WITH_COMPANY } from '@shared/lib';
import { PuestoTrabajoEnum } from '@shared/types';
import type { NewApplicantFormData } from '@shared/types';

interface NewApplicantFormProps {
  onSubmit?: (formData: NewApplicantFormData) => Promise<void> | void;
}

const NewApplicantForm: React.FC<NewApplicantFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<NewApplicantFormData>({
    nombres: '',
    apellidos: '',
    phoneMobile: '',
    documentNumber: '',
    documentType: 'DNI',
    positionOfInterest: '',
    company: 'ALBRU',
    campaign: 'COMPUTRABAJO',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Sanitizar nÃºmeros en phoneMobile y documentNumber
    let sanitizedValue = value;
    if (name === 'phoneMobile' || name === 'documentNumber') {
      sanitizedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: sanitizedValue,
      };

      // Auto-set company if position requires it
      if (name === 'positionOfInterest' && POSITIONS_WITH_COMPANY.includes(sanitizedValue)) {
        updatedData.company = '';
      }

      return updatedData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombres || !formData.apellidos || !formData.phoneMobile || !formData.positionOfInterest || !formData.campaign) {
      alert('Completa los campos obligatorios antes de enviar.');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        console.log('Applicant data:', formData);
      }
      alert('Postulante registrado correctamente');
      setFormData({
        nombres: '',
        apellidos: '',
        phoneMobile: '',
        documentNumber: '',
        documentType: 'DNI',
        positionOfInterest: '',
        company: '',
        campaign: '',
      });
    } catch (error) {
      console.error(error);
      alert('Error al registrar postulante. Verifica los datos e intenta de nuevo.');
    }
  };

  const documentTypeOptions = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'CE' },
  ];

  const companyOptions = [
    { value: 'ALBRU', label: 'ALBRU' },
    { value: 'WIN', label: 'WIN' },
    { value: 'CLARO', label: 'CLARO' },
  ];

  const positionOptions = Object.values(PuestoTrabajoEnum).map((value) => ({ value, label: value.replace(/_/g, ' ') }));

  const campaignOptions = [
    { value: 'COMPUTRABAJO', label: 'Computrabajo' },
    { value: 'INDEED', label: 'Indeed' },
    { value: 'REFERIDO', label: 'Referido' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'LINKEDIN', label: 'LinkedIn' },
  ];

  return (
    <ApplicantForm>
      <form onSubmit={handleSubmit} className="applicant-form-fields">
        <div>
          <label>Nombres *</label>
          <input name="nombres" value={formData.nombres} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Apellidos *</label>
          <input name="apellidos" value={formData.apellidos} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Teléfono móvil *</label>
          <input name="phoneMobile" value={formData.phoneMobile} onChange={handleInputChange} required inputMode="numeric" />
        </div>
        <Select
          label="Documento *"
          options={documentTypeOptions}
          value={formData.documentType}
          onChange={(value) => setFormData(prev => ({ ...prev, documentType: value as 'DNI' | 'CE' }))}
          required
        />
        <div>
          <label>Número de documento</label>
          <input name="documentNumber" value={formData.documentNumber} onChange={handleInputChange} inputMode="numeric" />
        </div>
        <Select
          label="Puesto de interés *"
          options={positionOptions}
          value={formData.positionOfInterest}
          onChange={(value) => setFormData(prev => {
            const updatedData = { ...prev, positionOfInterest: value };
            if (POSITIONS_WITH_COMPANY.includes(value)) {
              updatedData.company = '';
            }
            return updatedData;
          })}
          required
        />
        <Select
          label="Compañía"
          options={companyOptions}
          value={formData.company?.toUpperCase() || 'ALBRU'}
          onChange={(value) => setFormData(prev => ({ ...prev, company: value }))}
          required
        />
        <Select
          label="Campaña *"
          options={campaignOptions}
          value={formData.campaign}
          onChange={(value) => setFormData(prev => ({ ...prev, campaign: value }))}
          required
        />
        <button type="submit" className="btn-primary mt-2">Guardar postulante</button>
      </form>
    </ApplicantForm>
  );
};

export default NewApplicantForm;


