import React, { useEffect } from 'react';
import { useLeadBackoffice } from '@features/backoffice-advisor/hooks';
import {
  DsDataTable,
  DsInlineMessage,
  DsPageShell,
  DsSectionCard,
  DsStatusBadge,
  DsStatGrid,
  type DsDataTableColumn,
} from '@shared/ui/design-system';
import type { LeadGtrResponse } from '@shared/types';

let backofficeFetchInFlight: Promise<void> | null = null;

/**
 * Página principal de Asesor Backoffice
 * Visualización de ventas cerradas y operaciones post-venta
 */
export const PaginaAsesorBackoffice: React.FC = () => {
  const { loading, error, bandejaVentas, fetchBandejaVentas } = useLeadBackoffice();

  const columns: Array<DsDataTableColumn<LeadGtrResponse>> = [
    { key: 'id', label: 'ID Lead' },
    { key: 'nombreTitular', label: 'Cliente' },
    { key: 'nombreCampana', label: 'Campana' },
    { key: 'nombreAsesorAsignado', label: 'Asesor asignacion' },
    {
      key: 'estadoSeguimiento',
      label: 'Estado',
      render: (row) => <DsStatusBadge tone='info' label={row.estadoSeguimiento || '-'} />, 
    },
    {
      key: 'createdAt',
      label: 'Fecha registro',
      render: (row) => {
        const parsed = new Date(row.createdAt);
        if (Number.isNaN(parsed.getTime())) {
          return row.createdAt;
        }

        return parsed.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
  ];

  useEffect(() => {
    if (backofficeFetchInFlight) {
      return;
    }

    backofficeFetchInFlight = fetchBandejaVentas().finally(() => {
      backofficeFetchInFlight = null;
    });
  }, [fetchBandejaVentas]);

  if (error) {
    return (
      <DsPageShell
        eyebrow='Backoffice'
        title='Panel Asesor Backoffice'
        subtitle='Gestion post-venta y operacionalizacion de ventas cerradas.'
      >
        <DsInlineMessage tone='danger'>
          Error: {error}
        </DsInlineMessage>
      </DsPageShell>
    );
  }

  return (
    <DsPageShell
      eyebrow='Backoffice'
      title='Panel Asesor Backoffice'
      subtitle='Gestion post-venta y operacionalizacion de ventas cerradas.'
    >
      <DsStatGrid
        columns={2}
        items={[
          {
            label: 'Total ventas',
            value: bandejaVentas.length,
            helper: 'Registros disponibles en la bandeja de operacionalizacion',
          },
          {
            label: 'Estado de carga',
            value: loading ? 'Actualizando' : 'Listo',
            helper: loading ? 'Sincronizando datos de backoffice' : 'Datos sincronizados',
          },
        ]}
      />

      <DsSectionCard
        title='Ventas cerradas - operacionalizacion'
        description='Visualiza, valida y revisa el detalle operativo de cada lead cerrado.'
      >
        <DsDataTable<LeadGtrResponse>
          rows={bandejaVentas}
          columns={columns}
          loading={loading}
          emptyMessage='No hay ventas cerradas disponibles.'
          actions={[
            {
              label: 'Ver detalle',
              variant: 'secondary',
              onClick: (item) => console.log('Ver detalle:', item.id),
            },
            {
              label: 'Validar',
              variant: 'primary',
              onClick: (item) => console.log('Validar:', item.id),
            },
          ]}
          rowKey={(row) => row.id}
        />
      </DsSectionCard>
    </DsPageShell>
  );
};

export default PaginaAsesorBackoffice;
