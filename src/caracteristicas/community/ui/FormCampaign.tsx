/**
 * @file FormCampaign.tsx
 * @description Componente de formulario para crear Campaign
 * @layer features/community
 */

import React from 'react';
import { MultiSelect } from '@shared/ui/multiselect';
import type { CuentaPublicitaria, Proveedor } from '@entidades/campana';
import type { CampaignFormState, CampaignFormErrors } from '../hooks/useCampaignForm';

interface FormCampaignProps {
  formState: CampaignFormState;
  onInputChange: (field: 'nombre' | 'numeroWhatsapp', value: string) => void;
  onCuentasChange: (ids: string[]) => void;
  onProveedoresChange: (ids: string[]) => void;
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

        {/* Número WhatsApp */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Número WhatsApp *</label>
          <input
            style={errors.numeroWhatsapp ? errorInputStyle : inputStyle}
            type="tel"
            value={formState.numeroWhatsapp}
            placeholder="+57 3001234567"
            onChange={(e) => onInputChange('numeroWhatsapp', e.target.value)}
            disabled={submitting}
            required
          />
          {errors.numeroWhatsapp && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: 4 }}>{errors.numeroWhatsapp}</p>}
        </div>

        {/* Cuentas Publicitarias */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Cuentas Publicitarias *</label>
          <MultiSelect
            options={Array.isArray(cuentas) ? cuentas.map((c) => ({ id: String(c.id), label: `${c.numeroCuenta} - ${c.nombreCuenta}` })) : []}
            selectedIds={formState.cuentasIds}
            onChange={onCuentasChange}
            loading={loading}
            error={errors.cuentasIds}
            required
          />
        </div>

        {/* Proveedores */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Proveedores *</label>
          <MultiSelect
            options={Array.isArray(proveedores) ? proveedores.map((p) => ({ id: String(p.id), label: p.nombre })) : []}
            selectedIds={formState.proveedoresIds}
            onChange={onProveedoresChange}
            loading={loading}
            error={errors.proveedoresIds}
            required
          />
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
