/**
 * Componente: ProveedoresList
 * Tabla con lista de Proveedores
 */
import React from 'react';
import type { Proveedor } from '@entidades/proveedor';

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
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px',
  };

  const thStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: '14px',
  };

  const tdStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    padding: '12px',
    fontSize: '14px',
  };

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
        <h4>📋 Lista de Proveedores</h4>
        <div style={loaderStyle}>⏳ Cargando proveedores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h4>📋 Lista de Proveedores</h4>
        <div style={{ ...emptyStyle, color: '#dc3545' }}>
          ❌ Error al cargar proveedores
        </div>
      </div>
    );
  }

  if (!Array.isArray(proveedores)) {
    return (
      <div style={containerStyle}>
        <h4>📋 Lista de Proveedores</h4>
        <div style={{ ...emptyStyle, color: '#dc3545' }}>
          ❌ Respuesta inválida de proveedores
        </div>
      </div>
    );
  }

  if (proveedores.length === 0) {
    return (
      <div style={containerStyle}>
        <h4>📋 Lista de Proveedores (0)</h4>
        <div style={emptyStyle}>Sin proveedores registrados</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h4>📋 Lista de Proveedores ({proveedores.length})</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Fecha Creación</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((proveedor, idx) => (
              <tr
                key={proveedor.id}
                style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}
              >
                <td style={tdStyle}>{proveedor.id}</td>
                <td style={tdStyle}>{proveedor.nombre}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: proveedor.activo ? '#d4edda' : '#f8d7da',
                      color: proveedor.activo ? '#155724' : '#721c24',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {proveedor.activo ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                </td>
                <td style={tdStyle}>
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
