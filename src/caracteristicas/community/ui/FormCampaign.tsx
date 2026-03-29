/**
 * @file FormCampaign.tsx
 * @description Componente de formulario para crear Campaign
 * Contrato backend: campos idProveedor e idCuentaPublicitaria son singulares, no arrays
 * @layer features/community
 */

import React from 'react';
import type { CuentaPublicitaria, Proveedor } from '@entidades/campana';
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
  const inputStyle: React.CSSProperties = {
    marginRight: 8,
    marginBottom: 8,
    padding: 8,
    border: '1px solid #ccc',
    borderRadius: 4,
  };

  const errorInputStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#dc3545',
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <div>
      {globalMessage && (
        <div
          className="alert"
          style={{
            backgroundColor: globalMessage.startsWith('✅') ? '#d4edda' : '#f8d7da',
            color: globalMessage.startsWith('✅') ? '#155724' : '#721c24',
            padding: 12,
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          {globalMessage}
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        {/* Nombre */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Nombre *</label>
          <input
            style={errors.nombre ? errorInputStyle : inputStyle}
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
            style={errors.numeroWhatsappEmpresa ? errorInputStyle : inputStyle}
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
            style={errors.idCuentaPublicitaria ? errorInputStyle : inputStyle}
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
            style={errors.idProveedor ? errorInputStyle : inputStyle}
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
            style={{
              ...inputStyle,
              background: submitting ? '#ccc' : '#007bff',
              color: '#fff',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
            type="submit"
            disabled={submitting || loading}
          >
            {submitting ? '⏳ Creando campaña...' : '✅ Crear Campaña'}
          </button>
        </div>
      </form>
    </div>
  );
};
