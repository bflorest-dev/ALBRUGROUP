/**
 * Componente EditApplicantForm (moved to features/RRHH)
 */

import { useState } from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../../../utils/mockData';
import type { EditApplicantFormData, Applicant } from '../../../../../types';
import { Input } from '@atoms/Input';
import { Select } from '@atoms/Select';
import { Button } from '@atoms/Button';
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
          <Input
            id="nombres"
            name="nombres"
            label="NOMBRES"
            required
            placeholder="Nombres"
            value={formData.nombres}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <Input
            id="apellidos"
            name="apellidos"
            label="APELLIDOS"
            required
            placeholder="Apellidos"
            value={formData.apellidos}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Input
            id="phoneMobile"
            name="phoneMobile"
            label="CELULAR PERSONAL"
            required
            type="tel"
            placeholder="Número de celular"
            value={formData.phoneMobile}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <Select
            id="positionOfInterest"
            name="positionOfInterest"
            label="PUESTO DE INTERÉS"
            required
            options={
              Object.entries(AVAILABLE_POSITIONS_GROUPED).flatMap(([_category, positions]) =>
                positions.map((position) => ({ label: position, value: position }))
              )
            }
            value={formData.positionOfInterest}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Select
            id="documentType"
            name="documentType"
            label="TIPO DE DOCUMENTO"
            options={[{ label: 'DNI', value: 'DNI' }, { label: 'CE', value: 'CE' }]}
            value={formData.documentType}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <Input
            id="documentNumber"
            name="documentNumber"
            label="Nº DOCUMENTO"
            required
            placeholder="Número de documento"
            value={formData.documentNumber}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Select
            id="campaign"
            name="campaign"
            label="CAMPAÑA"
            required
            options={[
              { label: 'COMPUTRABAJO', value: 'COMPUTRABAJO' },
              { label: 'INDEED', value: 'INDEED' },
              { label: 'REFERIDO', value: 'REFERIDO' },
            ]}
            value={formData.campaign}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <Select
            id="company"
            name="company"
            label="COMPAÑÍA"
            required
            options={[{ label: 'CLARO', value: 'CLARO' }, { label: 'WIN', value: 'WIN' }]}
            value={formData.company}
            onChange={handleChange}
          />
        </div>
      </div>


      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          CANCELAR
        </Button>
        <Button type="submit" variant="primary">
          GUARDAR CAMBIOS
        </Button>
      </div>
    </form>
  );
};