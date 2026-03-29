/**
 * @file CampaignSection.tsx
 * @description Sección de Campañas para PaginaCommunity
 * @layer features/community
 */

import React from 'react';
import { FormCampaign } from './FormCampaign';
import { useCampaignForm } from '../hooks/useCampaignForm';
import type { CampanaResponse } from '@shared/types';

interface CampaignSectionProps {
  sectionStyle?: React.CSSProperties;
  campanas: CampanaResponse[];
  loading?: boolean;
  error?: boolean;
  onRefresh: () => Promise<void>;
}

export const CampaignSection: React.FC<CampaignSectionProps> = ({
  sectionStyle = {
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    background: '#fff',
  },
  campanas,
  loading,
  error,
  onRefresh,
}) => {
  const {
    formState,
    handleInputChange,
    handleCuentasChange,
    handleProveedoresChange,
    handleSubmit,
    cuentas,
    proveedores,
    loading: formLoading,
    submitting,
    errors,
    globalMessage,
  } = useCampaignForm();

  const renderCampanasTable = () => {
    if (error) {
      return <p style={{ color: '#dc3545' }}>Error al cargar campañas.</p>;
    }

    if (!campanas || campanas.length === 0) {
      return <p style={{ color: '#666' }}>No hay campañas registradas.</p>;
    }

    const columns = ['id', 'nombre', 'numeroWhatsappEmpresa', 'activo', 'idCuentaPublicitaria', 'idProveedor'];
    return (
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campanas.map((c: CampanaResponse) => (
              <tr key={c.id} style={{ background: '#fff' }}>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.id}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.nombre}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.numeroWhatsappEmpresa}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.activo ? 'Sí' : 'No'}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.idCuentaPublicitaria}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.idProveedor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section style={sectionStyle}>
      <h2>Campañas</h2>
      <FormCampaign
        formState={formState}
        onInputChange={handleInputChange}
        onCuentasChange={handleCuentasChange}
        onProveedoresChange={handleProveedoresChange}
        onSubmit={async () => {
          await handleSubmit();
          await onRefresh();
        }}
        cuentas={cuentas}
        proveedores={proveedores}
        loading={formLoading || Boolean(loading)}
        submitting={submitting}
        errors={errors}
        globalMessage={globalMessage}
      />

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Campañas existentes</h3>
          <button type="button" onClick={onRefresh} disabled={loading} style={{ padding: '6px 12px' }}>
            {loading ? 'Cargando...' : 'Actualizar Campañas'}
          </button>
        </div>
        {renderCampanasTable()}
      </div>
    </section>
  );
};
