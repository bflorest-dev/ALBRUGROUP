import React, { useCallback, useMemo } from 'react';
import {
  DsBadge,
  DsDataTable,
  type DsBadgeVariant,
  type DsDataTableAction,
  type DsDataTableColumn,
} from '@shared/ui/design-system';
import type { LeadAsesorVentasResponse } from '../model';
import styles from './TablaLeadsAsesorVentas.module.css';

interface TablaLeadsAsesorVentasProps {
  leads: LeadAsesorVentasResponse[];
  isLoading: boolean;
  onSelectLead: (lead: LeadAsesorVentasResponse) => void;
  onPreventa: (lead: LeadAsesorVentasResponse) => void;
  dashboardMode?: boolean;
}

/**
 * Tabla de leads asignados al asesor de ventas.
 * Consolidada sobre DsDataTable para evitar tablas ad-hoc por vista.
 */
export const TablaLeadsAsesorVentas: React.FC<TablaLeadsAsesorVentasProps> = ({
  leads,
  isLoading,
  onSelectLead,
  onPreventa,
  dashboardMode = false,
}) => {
  const beforeUnloadBypassKey = 'skip_beforeunload_once';

  const openExternalProtocol = useCallback((url: string) => {
    sessionStorage.setItem(beforeUnloadBypassKey, '1');

    const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!openedWindow) {
      window.location.href = url;
    }

    window.setTimeout(() => {
      sessionStorage.removeItem(beforeUnloadBypassKey);
    }, 1500);
  }, [beforeUnloadBypassKey]);

  const getDialNumber = useCallback((prefijo: string, numeroLead: string): string | null => {
    const prefijoLimpio = prefijo.replace(/\D/g, '');
    const numeroLimpio = numeroLead.replace(/\D/g, '');
    const numeroCompleto = `${prefijoLimpio}${numeroLimpio}`;

    if (!numeroCompleto) {
      return null;
    }

    return numeroCompleto;
  }, []);

  const getWhatsAppUrl = useCallback((prefijo: string, numeroLead: string): string | null => {
    const numeroCompleto = getDialNumber(prefijo, numeroLead);

    if (!numeroCompleto) {
      return null;
    }

    return `https://wa.me/${numeroCompleto}`;
  }, [getDialNumber]);

  const getMicroSipUrl = useCallback((numeroLead: string): string | null => {
    const numeroSoloLead = numeroLead.replace(/\D/g, '');

    if (!numeroSoloLead) {
      return null;
    }

    return `sip:${numeroSoloLead}`;
  }, []);

  const formatDateParts = (fecha: string): { date: string; time: string } => {
    const parsedDate = new Date(fecha);
    if (Number.isNaN(parsedDate.getTime())) {
      return { date: fecha, time: '--:--' };
    }

    const date = parsedDate.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const time = parsedDate.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return { date, time };
  };

  const formatEstado = useCallback((estado: string): string => {
    return estado
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  }, []);

  const getEstadoVariant = useCallback((estado: string): DsBadgeVariant => {
    switch (estado) {
      case 'NUEVO':
        return 'info';
      case 'EN_CONTACTO':
      case 'EN_SEGUIMIENTO':
        return 'warning';
      case 'TIPIFICADO':
      case 'CONTACTADO':
      case 'INTERESADO':
        return 'success';
      case 'NO_INTERESADO':
      case 'SIN_RESPUESTA':
        return 'error';
      default:
        return 'neutral';
    }
  }, []);

  const commonEstadoColumn = useMemo<DsDataTableColumn<LeadAsesorVentasResponse>>(
    () => ({
      key: 'estadoSeguimiento',
      label: 'Estado',
      render: (lead) => (
        <DsBadge
          label={formatEstado(lead.estadoSeguimiento)}
          variant={getEstadoVariant(lead.estadoSeguimiento)}
          size='sm'
        />
      ),
    }),
    [formatEstado, getEstadoVariant]
  );

  const defaultColumns = useMemo<DsDataTableColumn<LeadAsesorVentasResponse>[]>(
    () => [
      { key: 'id', label: 'Lead #', render: (lead) => lead.id },
      { key: 'fechaAsignacion', label: 'Fecha Asignación', render: (lead) => lead.fechaAsignacion },
      { key: 'prefijo', label: 'Prefijo', render: (lead) => lead.prefijo },
      { key: 'lead', label: 'Lead', render: (lead) => lead.lead },
      { key: 'nombreTitular', label: 'Titular', render: (lead) => lead.nombreTitular },
      { key: 'correo', label: 'Email', render: (lead) => lead.correo ?? '-' },
      commonEstadoColumn,
    ],
    [commonEstadoColumn]
  );

  const dashboardColumns = useMemo<DsDataTableColumn<LeadAsesorVentasResponse>[]>(
    () => [
      {
        key: 'fechaAsignacion',
        label: 'Fecha',
        render: (lead) => {
          const { date, time } = formatDateParts(lead.fechaAsignacion);
          return (
            <div className={styles.dateContent}>
              <span className={styles.dateMain}>{date}</span>
              <span className={styles.dateTime}>{time}</span>
            </div>
          );
        },
      },
      {
        key: 'lead',
        label: 'Lead',
        render: (lead) => (
          <div className={styles.leadCell}>
            <span className={styles.prefijo}>{lead.prefijo}</span>
            <span className={styles.numeroLead}>{lead.lead}</span>
          </div>
        ),
      },
      commonEstadoColumn,
    ],
    [commonEstadoColumn]
  );

  const defaultActions = useMemo<DsDataTableAction<LeadAsesorVentasResponse>[]>(
    () => [
      {
        label: 'Abrir',
        variant: 'ghost',
        onClick: onSelectLead,
      },
      {
        label: 'Tipificar',
        variant: 'primary',
        onClick: onPreventa,
      },
    ],
    [onPreventa, onSelectLead]
  );

  const dashboardActions = useMemo<DsDataTableAction<LeadAsesorVentasResponse>[]>(
    () => [
      {
        label: 'Llamar',
        variant: 'secondary',
        onClick: (lead) => {
          const url = getMicroSipUrl(String(lead.lead ?? ''));
          if (!url) return;
          openExternalProtocol(url);
        },
        disabled: (lead) => !getMicroSipUrl(String(lead.lead ?? '')),
      },
      {
        label: 'WhatsApp',
        variant: 'success',
        onClick: (lead) => {
          const url = getWhatsAppUrl(String(lead.prefijo ?? ''), String(lead.lead ?? ''));
          if (!url) return;
          openExternalProtocol(url);
        },
        disabled: (lead) => !getWhatsAppUrl(String(lead.prefijo ?? ''), String(lead.lead ?? '')),
      },
      {
        label: 'Tipificar',
        variant: 'primary',
        onClick: onPreventa,
      },
    ],
    [onPreventa, getWhatsAppUrl, getMicroSipUrl, openExternalProtocol]
  );

  return (
    <div className={styles.dataGridWrap}>
      <DsDataTable
        rows={leads}
        columns={dashboardMode ? dashboardColumns : defaultColumns}
        actions={dashboardMode ? dashboardActions : defaultActions}
        loading={isLoading}
        emptyMessage='No hay leads asignados'
        rowKey={(lead) => lead.id}
      />
    </div>
  );
};
