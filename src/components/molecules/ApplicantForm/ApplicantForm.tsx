import React from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../utils/mockData';
import type { NewApplicantFormData, EditApplicantFormData } from '../../../types';
import { Input } from '@atoms/Input';
import { Select } from '@atoms/Select';
import { Button } from '@atoms/Button';
import { POSITIONS_WITH_COMPANY } from '../../../utils/constants';
import './ApplicantForm.css';

export type ApplicantFormData = NewApplicantFormData | EditApplicantFormData;

interface ApplicantFormProps {
  formData: ApplicantFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel?: string;
  /** names of fields that should be disabled */
  disabledFields?: Array<keyof ApplicantFormData>;
}

export const ApplicantForm: React.FC<ApplicantFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  disabledFields,
}) => {
  // positions for which the company field should be visible
  const showCompanyPositions = POSITIONS_WITH_COMPANY; // imported constant

  // determine whether form is valid for submission
  const needsCompany = POSITIONS_WITH_COMPANY.includes(formData.positionOfInterest);
  const isSubmitDisabled =
    !formData.nombres.trim() ||
    !formData.apellidos.trim() ||
    !formData.phoneMobile.trim() ||
    !formData.documentNumber.trim() ||
    !formData.positionOfInterest.trim() ||
    !formData.campaign.trim() ||
    (needsCompany && !formData.company?.trim());

  return (
    <form className="applicant-form" onSubmit={onSubmit}>
      <div className="form-row">
        <div className={`form-group${disabledFields?.includes('nombres') ? ' disabled' : ''}`}>
          <Input
            id="nombres"
            name="nombres"
            label="NOMBRES"
            required
            placeholder="Nombres"
            value={formData.nombres}
            onChange={onChange}
            disabled={disabledFields?.includes('nombres')}
          />
        </div>

        <div className={`form-group${disabledFields?.includes('apellidos') ? ' disabled' : ''}`}>
          <Input
            id="apellidos"
            name="apellidos"
            label="APELLIDOS"
            required
            placeholder="Apellidos"
            value={formData.apellidos}
            onChange={onChange}
            disabled={disabledFields?.includes('apellidos')}
          />
        </div>
      </div>

      <div className="form-row">
        <div className={`form-group${disabledFields?.includes('phoneMobile') ? ' disabled' : ''}`}>
          <Input
            id="phoneMobile"
            name="phoneMobile"
            label="CELULAR PERSONAL"
            required
            type="tel"
            placeholder="Número de celular"
            value={formData.phoneMobile}
            onChange={onChange}
            disabled={disabledFields?.includes('phoneMobile')}
          />
        </div>

        <div className={`form-group${disabledFields?.includes('positionOfInterest') ? ' disabled' : ''}`}>
          <Select
            id="positionOfInterest"
            name="positionOfInterest"
            label="PUESTO DE INTERÉS"
            required
            // filter out ADMINISTRADOR when rendering the dropdown for new/edit applicants
            options={
              Object.entries(AVAILABLE_POSITIONS_GROUPED)
                .flatMap(([_cat, positions]) =>
                  positions.map((position) => ({ label: position.replace(/_/g, ' '), value: position }))
                )
                .filter((opt) => opt.value !== 'ADMINISTRADOR')
            }
            value={formData.positionOfInterest}
            onChange={onChange}
            disabled={disabledFields?.includes('positionOfInterest')}
          />
        </div>
      </div>

      <div className="form-row">
        <div className={`form-group${disabledFields?.includes('documentType') ? ' disabled' : ''}`}>
          <Select
            id="documentType"
            name="documentType"
            label="TIPO DE DOCUMENTO"
            required
            options={[{ label: 'DNI', value: 'DNI' }, { label: 'CE', value: 'CE' }]}
            value={formData.documentType}
            onChange={onChange}
            disabled={disabledFields?.includes('documentType')}
          />
        </div>

        <div className={`form-group${disabledFields?.includes('documentNumber') ? ' disabled' : ''}`}>
          <Input
            id="documentNumber"
            name="documentNumber"
            label="Nº DOCUMENTO"
            required
            placeholder="Número de documento"
            value={formData.documentNumber}
            onChange={onChange}
            disabled={disabledFields?.includes('documentNumber')}
          />
        </div>
      </div>

      <div className="form-row">
        <div className={`form-group${disabledFields?.includes('campaign') ? ' disabled' : ''}`}>
          <Select
            id="campaign"
            name="campaign"
            label="CAMPAÑA"
            required
            options={[
              { label: 'Selecciona Campaña', value: '' },
              { label: 'COMPUTRABAJO', value: 'COMPUTRABAJO' },
              { label: 'INDEED', value: 'INDEED' },
              { label: 'REFERIDO', value: 'REFERIDO' },
              { label: 'TIKTOK', value: 'TIKTOK' },
              { label: 'FACEBOOK', value: 'FACEBOOK' },
              { label: 'LINKEDIN', value: 'LINKEDIN' },
            ]}
            value={formData.campaign}
            onChange={onChange}
            disabled={disabledFields?.includes('campaign')}
          />
        </div>

        {showCompanyPositions.includes(formData.positionOfInterest) && (
          <div className={`form-group${disabledFields?.includes('company') ? ' disabled' : ''}`}>
            <Select
              id="company"
              name="company"
              label="COMPAÑÍA"
              required
              options={[
                { label: 'Selecciona Compañía', value: '' },
                { label: 'CLARO', value: 'CLARO' },
                { label: 'WIN', value: 'WIN' },
              ]}
              value={formData.company}
              onChange={onChange}
              disabled={disabledFields?.includes('company')}
            />
          </div>
        )}
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ApplicantForm;
