/**
 * Componente: ProveedoresList
 * Tabla con lista de Proveedores
 */
import React, { useState } from 'react';
import type { Proveedor } from '@entities/provider';
import { EstadoConfirmModal } from './EstadoConfirmModal';

interface ProveedoresListProps {
  proveedores: Proveedor[];
  loading: boolean;
  error?: boolean;
  updatingEstadoId: number | null;
  onToggleEstado: (id: number) => Promise<void>;
}

export const ProveedoresList: React.FC<ProveedoresListProps> = ({
  proveedores,
  loading,
  error,
  updatingEstadoId,
  onToggleEstado,
}) => {
  const [pendingProveedor, setPendingProveedor] = useState<Proveedor | null>(null);
  const [modalError, setModalError] = useState('');

  const handleOpenModal = (proveedor: Proveedor) => {
    setModalError('');
    setPendingProveedor(proveedor);
  };

  const handleCloseModal = () => {
    if (updatingEstadoId !== null) {
      return;
    }
    setPendingProveedor(null);
    setModalError('');
  };

  const handleConfirm = async () => {
    if (!pendingProveedor) {
      return;
    }

    try {
      setModalError('');
      await onToggleEstado(pendingProveedor.id);
      setPendingProveedor(null);
    } catch (err: any) {
      setModalError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    }
  };

  if (loading) {
    return (
      <div className="community-list-section">
        <h3 className="community-inline-title">Lista de proveedores</h3>
        <div className="community-state">Cargando proveedores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-list-section">
        <h3 className="community-inline-title">Lista de proveedores</h3>
        <div className="community-state is-error">
          Error al cargar proveedores
        </div>
      </div>
    );
  }

  if (!Array.isArray(proveedores)) {
    return (
      <div className="community-list-section">
        <h3 className="community-inline-title">Lista de proveedores</h3>
        <div className="community-state is-error">
          Respuesta invalida de proveedores
        </div>
      </div>
    );
  }

  if (proveedores.length === 0) {
    return (
      <div className="community-list-section">
        <h3 className="community-inline-title">Lista de proveedores (0)</h3>
        <div className="community-state">Sin proveedores registrados</div>
      </div>
    );
  }

  return (
    <>
      <div className="community-list-section">
        <h3 className="community-inline-title">Lista de proveedores ({proveedores.length})</h3>
        <div className="community-table-wrapper">
          <table className="community-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id}>
                  <td>{proveedor.nombre}</td>
                  <td>
                    <div className="community-status-control">
                      <label className="community-switch" aria-label={`Cambiar estado de ${proveedor.nombre}`}>
                        <input
                          type="checkbox"
                          checked={proveedor.activo}
                          onChange={() => handleOpenModal(proveedor)}
                          disabled={updatingEstadoId !== null}
                        />
                        <span className="community-switch-track" />
                      </label>
                      <span className={`community-switch-label ${proveedor.activo ? 'is-active' : 'is-inactive'}`}>
                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
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

      <EstadoConfirmModal
        open={Boolean(pendingProveedor)}
        submitting={updatingEstadoId !== null}
        errorMessage={modalError}
        onCancel={handleCloseModal}
        onConfirm={handleConfirm}
      />
    </>
  );
};
