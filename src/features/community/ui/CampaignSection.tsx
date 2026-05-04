/**
 * @file CampaignSection.tsx
 * @description Sección de Campañas para PaginaCommunity
 * @layer features/community
 */

import React from 'react';
import { FormCampaign } from './FormCampaign';
import { useCampaignForm } from '../hooks/useCampaignForm';
import type {
  CampanaResponse,
  CuentaPublicitariaResponse,
  PlanResponse,
  PromocionComercialResponse,
  ProveedorResponse,
  ZonaResponse,
} from '@shared/types';

interface CampaignSectionProps {
  sectionStyle?: React.CSSProperties;
  campanas: CampanaResponse[];
  catalogs: {
    cuentas: CuentaPublicitariaResponse[];
    proveedores: ProveedorResponse[];
    planes: PlanResponse[];
    zonas: ZonaResponse[];
    promociones: PromocionComercialResponse[];
  };
  loading?: boolean;
  error?: boolean;
  onRefresh: () => Promise<void>;
  updatingEstadoId?: number | null;
  onToggleEstado?: (campana: CampanaResponse, nextActivo: boolean) => Promise<void>;
}

export const CampaignSection: React.FC<CampaignSectionProps> = ({
  sectionStyle = {
    border: 'none',
    borderRadius: 0,
    padding: 0,
    marginBottom: 0,
    background: '#fff',
  },
  campanas,
  catalogs,
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
  } = useCampaignForm({
    catalogs: {
      cuentas: catalogs.cuentas,
      proveedores: catalogs.proveedores,
    },
  });

  const renderCampanasTable = () => {
    if (error) {
      return <p className="community-error">Error al cargar campanas.</p>;
    }

    if (!campanas || campanas.length === 0) {
      return <p className="community-empty">No hay campanas registradas.</p>;
    }

    const columns = ['id', 'nombre', 'numeroWhatsappEmpresa', 'activo', 'idCuentaPublicitaria', 'idProveedor'];
    return (
      <div className="community-table-wrapper" style={{ marginTop: 16 }}>
        <table className="community-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campanas.map((c: CampanaResponse) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.numeroWhatsappEmpresa}</td>
                <td>{c.activo ? 'Si' : 'No'}</td>
                <td>{c.idCuentaPublicitaria}</td>
                <td>{c.idProveedor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section style={sectionStyle} className="community-card">
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
          <button type="button" className="community-btn ghost" onClick={onRefresh} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar Campañas'}
          </button>
        </div>
        {renderCampanasTable()}
      </div>
    </section>
  );
};
