/**
 * @file CampaignSection.tsx
 * @description Sección de Campañas para PaginaCommunity
 * @layer features/community
 */

import React, { useMemo, useState } from 'react';
import { FormCampaign } from './FormCampaign';
import { useCampaignForm } from '../hooks/useCampaignForm';
import { EstadoConfirmModal } from './EstadoConfirmModal';
import type {
  CampanaResponse,
  CuentaPublicitariaResponse,
  PlanResponse,
  PromocionComercialResponse,
  ProveedorResponse,
  ZonaResponse,
} from '@shared/types';

interface CampaignSectionProps {
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
  updatingEstadoId: number | null;
  onToggleEstado: (campana: CampanaResponse, nextActivo: boolean) => Promise<void>;
}

export const CampaignSection: React.FC<CampaignSectionProps> = ({
  campanas,
  catalogs,
  loading,
  error,
  onRefresh,
  updatingEstadoId,
  onToggleEstado,
}) => {
  const [pendingCampana, setPendingCampana] = useState<CampanaResponse | null>(null);
  const [modalError, setModalError] = useState('');

  const cuentaNombreById = useMemo(
    () => new Map(catalogs.cuentas.map((cuenta) => [cuenta.id, cuenta.nombreCuenta])),
    [catalogs.cuentas],
  );

  const proveedorNombreById = useMemo(
    () => new Map(catalogs.proveedores.map((proveedor) => [proveedor.id, proveedor.nombre])),
    [catalogs.proveedores],
  );

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

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Número WhatsApp</th>
              <th>Estado</th>
              <th>Cuenta publicitaria</th>
              <th>Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {campanas.map((c: CampanaResponse) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.numeroWhatsappEmpresa}</td>
                <td>
                  <div className="community-status-control">
                    <label className="community-switch" aria-label={`Cambiar estado de ${c.nombre}`}>
                      <input
                        type="checkbox"
                        checked={c.activo}
                        onChange={() => {
                          setModalError('');
                          setPendingCampana(c);
                        }}
                        disabled={Boolean(loading) || updatingEstadoId !== null}
                      />
                      <span className="community-switch-track" />
                    </label>
                    <span className={`community-switch-label ${c.activo ? 'is-active' : 'is-inactive'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </td>
                <td>{cuentaNombreById.get(c.idCuentaPublicitaria) ?? `#${c.idCuentaPublicitaria}`}</td>
                <td>{proveedorNombreById.get(c.idProveedor) ?? `#${c.idProveedor}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleCloseModal = () => {
    if (updatingEstadoId !== null) {
      return;
    }
    setPendingCampana(null);
    setModalError('');
  };

  const handleConfirmToggle = async () => {
    if (!pendingCampana) {
      return;
    }

    try {
      setModalError('');
      await onToggleEstado(pendingCampana, !pendingCampana.activo);
      setPendingCampana(null);
    } catch (err: any) {
      setModalError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    }
  };

  return (
    <section className="community-card">
      <div className="community-section-head">
        <div>
          <h2>Campañas</h2>
          <p>Crea y administra campañas enlazadas a cuentas publicitarias y proveedores.</p>
        </div>
      </div>

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

      <div className="community-block-top-lg">
        <div className="community-inline-head">
          <h3 className="community-inline-title">Campañas existentes</h3>
          <button type="button" className="community-btn ghost" onClick={onRefresh} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar Campañas'}
          </button>
        </div>
        {renderCampanasTable()}
      </div>

      <EstadoConfirmModal
        open={Boolean(pendingCampana)}
        submitting={updatingEstadoId !== null}
        errorMessage={modalError}
        onCancel={handleCloseModal}
        onConfirm={handleConfirmToggle}
      />
    </section>
  );
};
