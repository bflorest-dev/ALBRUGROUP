import React from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../utils/mockData';
import type { NewApplicantFormData, EditApplicantFormData } from '../../../types';
import { Input } from '@atoms/Input';
import { Select } from '@atoms/Select';
import { Button } from '@atoms/Button';
import './ApplicantForm.css';

export type ApplicantFormData = NewApplicantFormData | EditApplicantFormData;

interface ApplicantFormProps {
  formData: ApplicantFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export const ApplicantForm: React.FC<ApplicantFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}) => {
  return (
    <form className="applicant-form" onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <Input
            id="nombres"
            name="nombres"
            label="NOMBRES"
            required
            placeholder="Nombres"
            value={formData.nombres}
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
          />
        </div>

        <div className="form-group">
          <Select
            id="positionOfInterest"
            name="positionOfInterest"
            label="PUESTO DE INTERÉS"
            required
            options={
              Object.entries(AVAILABLE_POSITIONS_GROUPED).flatMap(([_cat, positions]) =>
                positions.map((position) => ({ label: position, value: position }))
              )
            }
            value={formData.positionOfInterest}
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
          />
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ApplicantForm;
