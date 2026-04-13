/**
 * @file FormCampaign.tsx
 * @description Componente de formulario para crear Campaign
 * Contrato backend: campos idProveedor e idCuentaPublicitaria son singulares, no arrays
 * @layer features/community
 */

import React from 'react';
import type { CuentaPublicitaria, Proveedor } from '@entities/campana';
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
        <div
          className={globalMessage.startsWith('✅') ? 'community-alert' : 'community-error'}
          style={{ marginBottom: 16 }}
        >
          {globalMessage}
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        {/* Nombre */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Nombre *</label>
          <input
            className="community-input"
            style={errors.nombre ? { borderColor: '#d74343' } : undefined}
            type="text"
            value={formState.nombre}
            placeholder="Nombre de la campaña"
            onChange={(e) => onInputChange('nombre', e.target.value)}
            disabled={submitting}
            required
          />
          {errors.nombre && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: 4 }}>{errors.nombre}</p>}
        </div>

        {/* Número WhatsApp - Nombre correcto: numeroWhatsappEmpresa */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Número WhatsApp Empresa *</label>
          <input
            className="community-input"
            style={errors.numeroWhatsappEmpresa ? { borderColor: '#d74343' } : undefined}
            type="tel"
            value={formState.numeroWhatsappEmpresa}
            placeholder="+57 3001234567"
            onChange={(e) => onInputChange('numeroWhatsappEmpresa', e.target.value)}
            disabled={submitting}
            required
          />
          {errors.numeroWhatsappEmpresa && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: 4 }}>{errors.numeroWhatsappEmpresa}</p>}
        </div>

        {/* Cuentas Publicitarias - SELECT SIMPLE (no multi) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Cuenta Publicitaria *</label>
          <select
            className="community-select"
            style={errors.idCuentaPublicitaria ? { borderColor: '#d74343' } : undefined}
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
          {errors.idCuentaPublicitaria && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: 4 }}>{errors.idCuentaPublicitaria}</p>}
        </div>

        {/* Proveedores - SELECT SIMPLE (no multi) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Proveedor *</label>
          <select
            className="community-select"
            style={errors.idProveedor ? { borderColor: '#d74343' } : undefined}
            value={formState.idProveedor ?? ''}
            onChange={(e) => onProveedoresChange(e.target.value ? Number(e.target.value) : null)}
            disabled={submitting || loading}
            required
          >
            <option value="">-- Selecciona un proveedor --</option>
            {Array.isArray(proveedores) &&
              proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
          </select>
          {errors.idProveedor && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: 4 }}>{errors.idProveedor}</p>}
        </div>

        {/* Botones */}
        <div style={{ marginTop: 24 }}>
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
