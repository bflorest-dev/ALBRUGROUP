/**
 * Componente: ProveedoresList
 * Tabla con lista de Proveedores
 */
import React from 'react';
import type { Proveedor } from '@entities/provider/model/proveedor';

interface ProveedoresListProps {
  proveedores: Proveedor[];
  loading: boolean;
  error?: boolean;
}

export const ProveedoresList: React.FC<ProveedoresListProps> = ({
  proveedores,
  loading,
  error,
}) => {
  const containerStyle: React.CSSProperties = {
    marginTop: '24px',
  };

  const loaderStyle: React.CSSProperties = {
    padding: '24px',
    textAlign: 'center',
    color: '#666',
  };

  const emptyStyle: React.CSSProperties = {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <h4>Lista de proveedores</h4>
        <div style={loaderStyle}>Cargando proveedores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h4>Lista de proveedores</h4>
        <div style={{ ...emptyStyle, color: '#dc3545' }}>
          Error al cargar proveedores
        </div>
      </div>
    );
  }

  if (!Array.isArray(proveedores)) {
    return (
      <div style={containerStyle}>
        <h4>Lista de proveedores</h4>
        <div style={{ ...emptyStyle, color: '#dc3545' }}>
          Respuesta invalida de proveedores
        </div>
      </div>
    );
  }

  if (proveedores.length === 0) {
    return (
      <div style={containerStyle}>
        <h4>Lista de proveedores (0)</h4>
        <div style={emptyStyle}>Sin proveedores registrados</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h4>Lista de proveedores ({proveedores.length})</h4>
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((proveedor) => (
              <tr key={proveedor.id}>
                <td>{proveedor.id}</td>
                <td>{proveedor.nombre}</td>
                <td>
                  <span
                    className={`community-status ${proveedor.activo ? 'active' : 'inactive'}`}
                  >
                    {proveedor.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  {new Date(proveedor.createdAt).toLocaleDateString('es-PE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
