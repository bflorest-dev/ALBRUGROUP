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
  onProveedorCreado?: () => Promise<void>;
}

export const ProveedoresSection: React.FC<ProveedoresSectionProps> = ({
  sectionStyle = {},
  onProveedorCreado,
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
  } = useProveedoresForm({ onProveedorCreado });

  const defaultStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#fff',
  };

  return (
    <div style={{ ...defaultStyle, ...sectionStyle }}>
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
