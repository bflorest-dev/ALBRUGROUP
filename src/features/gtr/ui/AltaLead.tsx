/**
 * Componente AltaLead - Formulario para registrar nuevo lead
 * Endpoint: POST /preventa/intake
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState } from 'react';
import { FormInput } from '@shared/ui/form-input/FormInput';
import { FormSelect } from '@shared/ui/form-select/FormSelect';
import { Button } from '@shared/ui';
import { Alert } from '@shared/ui/utilities/Utilities';
import { PrefixSelector } from '@features/phone-validation';
import { useLeadsCampaignsQuery } from '@shared/api/queries';
import { useCreateLeadMutation } from '../hooks/useGtrQueries';
import type { PermisosGTR, BaseLead } from '@entities/lead/types';
import styles from './AltaLead.module.css';

interface AltaLeadProps {
  permisos: PermisosGTR;
  onSuccess?: () => void;
  dashboardMode?: boolean;
}

/**
 * Formulario para registro de nuevo lead
 * Validaciones:
 * - prefijo: requerido, texto
 * - lead: requerido, solo números
 * - idCampana: requerido, select
 * - base: requerido, select con valores predefinidos
 */
export const AltaLead: React.FC<AltaLeadProps> = ({ permisos, onSuccess, dashboardMode = false }) => {
  // ========== ESTADO FORMULARIO ==========
  // Mantenemos prefijo y lead separados para UX, pero los combinamos al enviar
  const [formData, setFormData] = useState<{
    prefijo: string;
    lead: string;
    idCampana: number;
    base: 'WHATSAPP' | 'MESSENGER' | 'REFERIDO' | 'MASIVO';
  }>({
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

    if (!Number.isInteger(formData.idCampana) || formData.idCampana <= 0) {
      newErrors.idCampana = 'Campaña requerida';
    }

    if (!formData.base) {
      newErrors.base = 'Base requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLERS ==========
  const handleInputChange = (
    field: 'prefijo' | 'lead' | 'idCampana' | 'base',
    value: string | number
  ) => {
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

  const handleCampaignChange = (idCampana: string) => {
    const id = Number(idCampana);
    const campaign = campaigns.find((c) => c.id === id);
    setSelectedCampaign(campaign ? { id: campaign.id, nombre: campaign.nombre } : null);
    handleInputChange('idCampana', id);
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
      // Payload according to backend documentation
      // POST /preventa/intake expects: { prefijo, lead, idCampana, base }
      const payload = {
        prefijo: formData.prefijo,
        lead: formData.lead,
        idCampana: formData.idCampana,
        base: formData.base,
      };

      await createLeadMutation.mutateAsync(payload);

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
    <div className={`${styles.formContainer} ${dashboardMode ? styles.dashboardMode : ''}`}>
      <h2 className={styles.formTitle}>Registrar Nuevo Lead</h2>

      {errors.form && (
        <Alert
          type={createLeadMutation.isError ? 'error' : 'success'}
          message={errors.form}
          dismissible
          onClose={() => setErrors({ form: '' })}
        />
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Prefijo con detección de país */}
        <div className={dashboardMode ? styles.dashboardField : ''}>
          <PrefixSelector
            value={formData.prefijo}
            onChange={(prefix) => handleInputChange('prefijo', prefix)}
            label="Prefijo Telefónico"
            placeholder="Selecciona un país"
            error={errors.prefijo}
          />
        </div>

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
          inputMode="numeric"
          className={`${dashboardMode ? styles.dashboardInput : ''} ${styles.leadNumberInput}`.trim()}
        />

        {/* Campaña */}
        <FormSelect
          label="Campaña"
          name="idCampana"
          value={formData.idCampana || ''}
          onChange={handleCampaignChange}
          options={campaignOptions}
          placeholder="Selecciona una campaña"
          required
          isLoading={campaignsQuery.isPending}
          error={errors.idCampana}
          disabled={campaignsQuery.isPending}
          className={dashboardMode ? styles.dashboardField : ''}
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
          className={dashboardMode ? styles.dashboardField : ''}
        />

        {/* Botón Submit */}
        <Button
          type="submit"
          variant="default"
          className="w-full text-lg"
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
