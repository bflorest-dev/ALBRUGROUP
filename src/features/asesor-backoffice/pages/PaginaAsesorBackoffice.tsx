import React, { useEffect } from 'react';
import { useLeadBackoffice } from '../hooks';
import { Table } from '@shared/ui/Table';
import type { LeadGtrResponse } from '@shared/types';

let backofficeFetchInFlight: Promise<void> | null = null;

/**
 * Página principal de Asesor Backoffice
 * Visualización de ventas cerradas y operaciones post-venta
 */
export const PaginaAsesorBackoffice: React.FC = () => {
  const { loading, error, bandejaVentas, fetchBandejaVentas } = useLeadBackoffice();

  useEffect(() => {
    if (backofficeFetchInFlight) {
      return;
    }

    backofficeFetchInFlight = fetchBandejaVentas().finally(() => {
      backofficeFetchInFlight = null;
    });
  }, [fetchBandejaVentas]);

  if (error) {
    return <div className="alert alert-danger">Error: {error}</div>;
  }

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">Panel Asesor Backoffice - Gestión Post-Venta</h1>

      <div className="card">
        <div className="card-header">
          <h5>Ventas Cerradas - Operacionalización</h5>
        </div>
        <div className="card-body">
          <Table<LeadGtrResponse>
            data={bandejaVentas}
            loading={loading}
            columns={[
              { key: 'id', label: 'ID Lead' },
              { key: 'nombreTitular', label: 'Cliente' },
              { key: 'nombreCampana', label: 'Campaña' },
              { key: 'nombreAsesorAsignado', label: 'Asesor Asignación' },
              { key: 'estadoSeguimiento', label: 'Estado' },
              { key: 'createdAt', label: 'Fecha Registro' },
            ]}
            actions={[
              {
                label: 'Ver Detalle',
                onClick: (item) => console.log('Ver detalle:', item.id),
              },
              {
                label: 'Validar',
                onClick: (item) => console.log('Validar:', item.id),
              },
            ]}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-muted">
          Total de ventas: <strong>{bandejaVentas.length}</strong>
        </p>
      </div>
    </div>
  );
};

export default PaginaAsesorBackoffice;
