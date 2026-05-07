/**
 * @file FormCampaign.tsx
 * @description Componente de formulario para crear Campaign
 * Contrato backend: campos idProveedor e idCuentaPublicitaria son singulares, no arrays
 * @layer features/community
 */

import React from 'react';
import type { CuentaPublicitaria, Proveedor } from '@entities/campaign';
import type { CampaignFormState, CampaignFormErrors } from '../hooks/useCampaignForm';

interface FormCampaignProps {
  formState: CampaignFormState;
  onInputChange: (field: 'nombre' | 'numeroWhatsappEmpresa', value: string) => void;
  onCuentasChange: (id: number | null) => void;
  onProveedoresChange: (id: number | null) => void;
  onSubmit: () => Promise<void>;
  cuentas: CuentaPublicitaria[];
  proveedores: Proveedor[];
  loading: boolean;
  submitting: boolean;
  errors: CampaignFormErrors;
  globalMessage: string;
}

export const FormCampaign: React.FC<FormCampaignProps> = ({
  formState,
  onInputChange,
  onCuentasChange,
  onProveedoresChange,
  onSubmit,
  cuentas,
  proveedores,
  loading,
  submitting,
  errors,
  globalMessage,
}) => {
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <div>
      {globalMessage && (
        <div className={`${globalMessage.startsWith('✅') ? 'community-alert' : 'community-error'} community-message`}>
          {globalMessage}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="community-form">
        <div className="community-field">
          <label>Nombre *</label>
          <input
            className={`community-input ${errors.nombre ? 'is-invalid' : ''}`}
            type="text"
            value={formState.nombre}
            placeholder="Nombre de la campaña"
            onChange={(e) => onInputChange('nombre', e.target.value)}
            disabled={submitting}
            required
          />
          {errors.nombre && <p className="community-error-text">{errors.nombre}</p>}
        </div>

        <div className="community-field">
          <label>Número WhatsApp Empresa *</label>
          <input
            className={`community-input ${errors.numeroWhatsappEmpresa ? 'is-invalid' : ''}`}
            type="tel"
            value={formState.numeroWhatsappEmpresa}
            placeholder="+57 3001234567"
            onChange={(e) => onInputChange('numeroWhatsappEmpresa', e.target.value)}
            disabled={submitting}
            required
          />
          {errors.numeroWhatsappEmpresa && <p className="community-error-text">{errors.numeroWhatsappEmpresa}</p>}
        </div>

        <div className="community-field">
          <label>Cuenta Publicitaria *</label>
          <select
            className={`community-select ${errors.idCuentaPublicitaria ? 'is-invalid' : ''}`}
            value={formState.idCuentaPublicitaria ?? ''}
            onChange={(e) => onCuentasChange(e.target.value ? Number(e.target.value) : null)}
            disabled={submitting || loading}
            required
          >
            <option value="">-- Selecciona una cuenta --</option>
            {Array.isArray(cuentas) &&
              cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.numeroCuenta} - {c.nombreCuenta}
                </option>
              ))}
          </select>
          {errors.idCuentaPublicitaria && <p className="community-error-text">{errors.idCuentaPublicitaria}</p>}
        </div>

        <div className="community-field">
          <label>Proveedor *</label>
          <select
            className={`community-select ${errors.idProveedor ? 'is-invalid' : ''}`}
            value={formState.idProveedor ?? ''}
            onChange={(e) => onProveedoresChange(e.target.value ? Number(e.target.value) : null)}
            disabled={submitting || loading}
            required
          >
            <option value="">-- Selecciona un proveedor --</option>
            {Array.isArray(proveedores) &&
              proveedores.filter((p) => p.activo).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
          </select>
          {errors.idProveedor && <p className="community-error-text">{errors.idProveedor}</p>}
        </div>

        <div className="community-actions">
          <button
            className="community-btn primary"
            type="submit"
            disabled={submitting || loading}
          >
            {submitting ? 'Creando campana...' : 'Crear Campana'}
          </button>
        </div>
      </form>
    </div>
  );
};
