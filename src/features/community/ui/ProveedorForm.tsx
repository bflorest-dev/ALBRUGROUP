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
  return (
    <div className="community-block-top-md">
      <h3>Crear proveedor</h3>

      <div className="community-field community-field-max-sm">
        <label>Nombre</label>
        <input
          type="text"
          placeholder="Ej: Proveedor XYZ"
          value={formState.nombre}
          onChange={(e) => onInputChange('nombre', e.target.value)}
          className={`community-input ${errors.nombre ? 'is-invalid' : ''}`}
          disabled={submitting || loading}
        />
        {errors.nombre && <div className="community-error-text">{errors.nombre}</div>}
      </div>

      <div className="community-actions">
        <button
          onClick={onSubmit}
          disabled={submitting || loading}
          className="community-btn primary"
        >
          {submitting ? 'Creando...' : 'Crear proveedor'}
        </button>
      </div>

      {globalMessage && (
        <div className={`${globalMessage.includes('✅') ? 'community-alert' : 'community-error'} community-message`}>
          {globalMessage}
        </div>
      )}
    </div>
  );
};
