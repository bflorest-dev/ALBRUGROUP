/**
 * @file CampaignSection.tsx
 * @description Sección de Campañas para PaginaCommunity
 * @layer features/community
 */

import React from 'react';
import { FormCampaign } from './FormCampaign';
import { useCampaignForm } from '../hooks/useCampaignForm';

interface CampaignSectionProps {
  sectionStyle?: React.CSSProperties;
}

export const CampaignSection: React.FC<CampaignSectionProps> = ({
  sectionStyle = {
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    background: '#fff',
  },
}) => {
  const {
    formState,
    handleInputChange,
    handleCuentasChange,
    handleProveedoresChange,
    handleSubmit,
    cuentas,
    proveedores,
    loading,
    submitting,
    errors,
    globalMessage,
  } = useCampaignForm();

  return (
    <section style={sectionStyle}>
      <h2>Campañas</h2>
      <FormCampaign
        formState={formState}
        onInputChange={handleInputChange}
        onCuentasChange={handleCuentasChange}
        onProveedoresChange={handleProveedoresChange}
        onSubmit={handleSubmit}
        cuentas={cuentas}
        proveedores={proveedores}
        loading={loading}
        submitting={submitting}
        errors={errors}
        globalMessage={globalMessage}
      />
    </section>
  );
};
