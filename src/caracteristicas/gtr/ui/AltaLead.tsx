/**
 * Componente AltaLead - Formulario para registrar nuevo lead
 * Endpoint: POST /leads/leads/intake
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState } from 'react';
import { FormInput } from '@shared/ui/form-input/FormInput';
import { FormSelect } from '@shared/ui/form-select/FormSelect';
import { Button, Alert, Spinner } from '@shared/ui/utilities/Utilities';
import { useLeadsCampaignsQuery } from '@shared/api/queries';
import { useCreateLeadMutation } from '../hooks/useGtrQueries';
import type { LeadIntakeRequest, PermisosGTR, BaseLead } from '@entidades/lead/types';
import styles from './AltaLead.module.css';

interface AltaLeadProps {
  permisos: PermisosGTR;
  onSuccess?: () => void;
}

/**
 * Formulario para registro de nuevo lead
 * Validaciones:
 * - prefijo: requerido, texto
 * - lead: requerido, solo números
 * - idCampana: requerido, select
 * - base: requerido, select con valores predefinidos
 */
export const AltaLead: React.FC<AltaLeadProps> = ({ permisos, onSuccess }) => {
  // ========== ESTADO FORMULARIO ==========
  const [formData, setFormData] = useState<LeadIntakeRequest>({
    prefijo: '',
    lead: '',
    idCampana: 0,
    base: 'WHATSAPP',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCampaign, setSelectedCampaign] = useState<{ id: number; nombre: string } | null>(
    null
  );

  // ========== MUTACIONES ==========
  const createLeadMutation = useCreateLeadMutation();

  // ========== QUERIES ==========
  const campaignsQuery = useLeadsCampaignsQuery();
  const campaigns = campaignsQuery.data ?? [];

  // ========== VALIDACIONES ==========
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.prefijo.trim()) {
      newErrors.prefijo = 'Prefijo requerido';
    }

    if (!formData.lead.trim()) {
      newErrors.lead = 'Número de lead requerido';
    } else if (!/^\d+$/.test(formData.lead)) {
      newErrors.lead = 'Solo se permiten números';
    }

    if (!formData.idCampana || Number(formData.idCampana) <= 0) {
      newErrors.idCampana = 'Campaña requerida';
    }

    if (!formData.base) {
      newErrors.base = 'Base requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLERS ==========
  const handleInputChange = (field: keyof LeadIntakeRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'idCampana' ? Number(value) : String(value),
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCampaignChange = (idCampana: string | number) => {
    const id = Number(idCampana);
    const campaign = campaigns.find((c) => c.id === id);
    setSelectedCampaign(campaign ? { id: campaign.id, nombre: campaign.nombre } : null);
    setFormData((prev) => ({ ...prev, idCampana: id }));

    if (errors.idCampana) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.idCampana;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!permisos.CREATE_LEADS) {
      setErrors({ form: 'No tienes permiso para crear leads' });
      return;
    }

    try {
      await createLeadMutation.mutateAsync(formData);

      // Reset form
      setFormData({
        prefijo: '',
        lead: '',
        idCampana: 0,
        base: 'WHATSAPP',
      });
      setSelectedCampaign(null);
      setErrors({});

      onSuccess?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear lead';
      setErrors({ form: errorMsg });
    }
  };

  // ========== RENDER ==========
  if (!permisos.CREATE_LEADS) {
    return (
      <Alert
        type="warning"
        message="No tienes permiso para crear leads"
      />
    );
  }

  const campaignOptions = campaigns.map((c) => ({
    value: c.id,
    label: c.nombre,
  }));

  const baseOptions = [
    { value: 'WHATSAPP', label: 'WHATSAPP' },
    { value: 'MESSENGER', label: 'MESSENGER' },
    { value: 'REFERIDO', label: 'REFERIDO' },
    { value: 'MASIVO', label: 'MASIVO' },
  ];

  return (
    <div className={styles.formContainer}>
      <h2>Registrar Nuevo Lead</h2>

      {errors.form && (
        <Alert
          type={createLeadMutation.isError ? 'error' : 'success'}
          message={errors.form}
          dismissible
          onClose={() => setErrors({ form: '' })}
        />
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Prefijo */}
        <FormInput
          label="Prefijo"
          name="prefijo"
          value={formData.prefijo}
          onChange={(value) => handleInputChange('prefijo', value)}
          placeholder="Ej: +51, 0051"
          required
          error={errors.prefijo}
          maxLength={10}
          helpText="País o área telefónica"
        />

        {/* Lead (número) */}
        <FormInput
          label="Número de Lead"
          name="lead"
          type="tel"
          value={formData.lead}
          onChange={(value) => handleInputChange('lead', value.replace(/\D/g, ''))}
          placeholder="Ej: 987654321"
          required
          error={errors.lead}
          maxLength={15}
          helpText="Solo números"
        />

        {/* Campaña */}
        <FormSelect
          label="Campaña"
          name="idCampana"
          value={formData.idCampana ? String(formData.idCampana) : ''}
          onChange={handleCampaignChange}
          options={campaignOptions}
          placeholder="Selecciona una campaña"
          required
          isLoading={campaignsQuery.isPending}
          error={errors.idCampana}
          disabled={campaignsQuery.isPending}
        />

        {selectedCampaign && (
          <p className={styles.campaignInfo}>
            📢 Campaña seleccionada: <strong>{selectedCampaign.nombre}</strong>
          </p>
        )}

        {/* Base */}
        <FormSelect
          label="Base (Canal)"
          name="base"
          value={formData.base}
          onChange={(value) => handleInputChange('base', value as BaseLead)}
          options={baseOptions}
          required
          error={errors.base}
        />

        {/* Botón Submit */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          isLoading={createLeadMutation.isPending}
          disabled={
            !permisos.CREATE_LEADS ||
            campaignsQuery.isPending ||
            createLeadMutation.isPending
          }
        >
          {createLeadMutation.isPending ? 'Registrando...' : '✓ Registrar Lead'}
        </Button>

        {createLeadMutation.isError && (
          <Alert
            type="error"
            message={
              createLeadMutation.error instanceof Error
                ? createLeadMutation.error.message
                : 'Error al registrar lead'
            }
            dismissible
            onClose={() => createLeadMutation.reset()}
          />
        )}
      </form>
    </div>
  );
};

export default AltaLead;
