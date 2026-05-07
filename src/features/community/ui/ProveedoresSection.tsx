/**
 * Componente: ProveedoresSection
 * Contenedor que integra ProveedorForm + ProveedoresList
 */
import React from 'react';
import { useProveedoresForm } from '../hooks/useProveedoresForm';
import { ProveedorForm } from './ProveedorForm';
import { ProveedoresList } from './ProveedoresList';

export const ProveedoresSection: React.FC = () => {
  const {
    proveedores,
    formState,
    errors,
    globalMessage,
    loading,
    submitting,
    updatingEstadoId,
    error,
    handleInputChange,
    handleSubmit,
    toggleEstadoProveedor,
  } = useProveedoresForm();

  return (
    <section className="community-card">
      <div className="community-section-head">
        <div>
          <h2>Proveedores</h2>
          <p>Registra proveedores y revisa su estado para asociarlos a campañas, planes y promociones.</p>
        </div>
      </div>

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
        updatingEstadoId={updatingEstadoId}
        onToggleEstado={toggleEstadoProveedor}
      />
    </section>
  );
};
