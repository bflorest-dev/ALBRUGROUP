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
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: errors.nombre ? '2px solid #dc3545' : '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    maxWidth: '300px',
  };

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

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: submitting ? '#6c757d' : '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: submitting ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    opacity: submitting ? 0.7 : 1,
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h4>📝 Crear Proveedor</h4>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Nombre</label>
        <input
          type="text"
          placeholder="Ej: Proveedor XYZ"
          value={formState.nombre}
          onChange={(e) => onInputChange('nombre', e.target.value)}
          style={inputStyle}
          disabled={submitting || loading}
        />
        {errors.nombre && <div style={errorStyle}>❌ {errors.nombre}</div>}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || loading}
        style={buttonStyle}
      >
        {submitting ? '⏳ Creando...' : '➕ Crear Proveedor'}
      </button>

      {globalMessage && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: globalMessage.includes('✅') ? '#d4edda' : '#f8d7da',
            color: globalMessage.includes('✅') ? '#155724' : '#721c24',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {globalMessage}
        </div>
      )}
    </div>
  );
};
