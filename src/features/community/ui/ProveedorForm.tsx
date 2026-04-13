/**
 * Componente: ProveedorForm
 * Presentación del formulario para crear un Proveedor
 */
import React from 'react';

interface ProveedorFormProps {
  formState: { nombre: string };
  errors: { nombre?: string };
  loading: boolean;
  submitting: boolean;
  onInputChange: (field: 'nombre', value: string) => void;
  onSubmit: () => void;
  globalMessage?: string;
}

export const ProveedorForm: React.FC<ProveedorFormProps> = ({
  formState,
  errors,
  loading,
  submitting,
  onInputChange,
  onSubmit,
  globalMessage,
}) => {
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 'bold',
    fontSize: '14px',
  };

  const errorStyle: React.CSSProperties = {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '4px',
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3>Crear proveedor</h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Nombre</label>
        <input
          type="text"
          placeholder="Ej: Proveedor XYZ"
          value={formState.nombre}
          onChange={(e) => onInputChange('nombre', e.target.value)}
          className="community-input"
          style={{ maxWidth: 360, borderColor: errors.nombre ? '#d74343' : undefined }}
          disabled={submitting || loading}
        />
        {errors.nombre && <div style={errorStyle}>{errors.nombre}</div>}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || loading}
        className="community-btn primary"
      >
        {submitting ? 'Creando...' : 'Crear proveedor'}
      </button>

      {globalMessage && (
        <div className={globalMessage.includes('✅') ? 'community-alert' : 'community-error'} style={{ marginTop: 12 }}>
          {globalMessage}
        </div>
      )}
    </div>
  );
};
