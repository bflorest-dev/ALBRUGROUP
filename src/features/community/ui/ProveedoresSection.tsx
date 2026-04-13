/**
 * Componente: ProveedoresSection
 * Contenedor que integra ProveedorForm + ProveedoresList
 */
import React from 'react';
import { useProveedoresForm } from '../hooks/useProveedoresForm';
import { ProveedorForm } from './ProveedorForm';
import { ProveedoresList } from './ProveedoresList';

interface ProveedoresSectionProps {
  sectionStyle?: React.CSSProperties;
}

export const ProveedoresSection: React.FC<ProveedoresSectionProps> = ({
  sectionStyle = {},
}) => {
  const {
    proveedores,
    formState,
    errors,
    globalMessage,
    loading,
    submitting,
    error,
    handleInputChange,
    handleSubmit,
  } = useProveedoresForm();

  const defaultStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: 0,
    padding: 0,
    backgroundColor: '#fff',
  };

  return (
    <div className="community-card" style={{ ...defaultStyle, ...sectionStyle }}>
      <ProveedorForm
        formState={formState}
        errors={errors}
        loading={loading}
        submitting={submitting}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        globalMessage={globalMessage}
      />

      <ProveedoresList
        proveedores={proveedores}
        loading={loading}
        error={error}
      />
    </div>
  );
};
