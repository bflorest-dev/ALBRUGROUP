/**
 * Componente TablaLeadsAsesorVentas - Bandeja de leads para asesor de ventas
 * Endpoint: GET /leads/leads/asesor-ventas
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState, useMemo } from 'react';
import { Badge } from '@shared/ui';
import { Spinner, Alert } from '@shared/ui/utilities/Utilities';
import { DsDataTable, type DsDataTableAction, type DsDataTableColumn } from '@shared/ui/design-system';
import { useLeadsAsesorVentas, useTypifyLeadMutation } from '../hooks/useGtrQueries';
import type { LeadAsesorVentasResponse, PermisosGTR } from '@entities/lead/types';
import styles from './TablaLeadsAsesorVentas.module.css';

interface TablaLeadsAsesorVentasProps {
  permisos: PermisosGTR;
  idAsesor?: number;
  onLeadClick?: (lead: LeadAsesorVentasResponse) => void;
  itemsPerPage?: number;
  dashboardMode?: boolean;
}

/**
 * Tabla de Asesor de Ventas con:
 * - Columnas: ID, fecha asignación, prefijo, lead, titular, email, estado seguimiento
 * - Búsqueda
 * - Filtrado por estado
 * - Paginación
 * - Acciones: editar, tipificar
 */
export const TablaLeadsAsesorVentas: React.FC<TablaLeadsAsesorVentasProps> = ({
  permisos,
  idAsesor,
  onLeadClick,
  itemsPerPage = 20,
  dashboardMode = false,
}) => {
  // ========== ESTADO ==========
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ========== QUERIES ==========
  const leadsQuery = useLeadsAsesorVentas({
    idAsesor,
  });
  const leads = leadsQuery.data ?? [];

  // ========== MUTACIONES ==========
  const typifyMutation = useTypifyLeadMutation();

  // ========== FILTRADO ==========
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm ||
        lead.id.toString().includes(searchTerm) ||
        lead.lead.includes(searchTerm) ||
        (lead.nombreTitular?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.correo?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesEstado = !filterEstado || lead.estadoSeguimiento === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [leads, searchTerm, filterEstado]);

  // ========== VALORES ÚNICOS PARA FILTROS ==========
  const estados = useMemo(() => {
    const unique = new Set(leads.map((l) => l.estadoSeguimiento).filter(Boolean));
    return Array.from(unique).sort();
  }, [leads]);

  // ========== PAGINACIÓN ==========
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  // ========== HELPER FUNCTIONS ==========
  const getEstadoBadgeVariant = (estado: string) => {
    const variants: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
      NUEVO: 'info',
      EN_SEGUIMIENTO: 'warning',
      CONTACTADO: 'info',
      INTERESADO: 'success',
      NO_INTERESADO: 'error',
      SIN_RESPUESTA: 'warning',
      TIPIFICADO: 'success',
      CERRADO: 'success',
    };
    return variants[estado] || 'info';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPhone = (prefijo: string, lead: string): string => {
    return `${prefijo}${lead}`;
  };

  const columns = useMemo<DsDataTableColumn<LeadAsesorVentasResponse>[]>(
    () => [
      {
        key: 'id',
        label: 'ID',
        render: (lead) => <strong>#{lead.id}</strong>,
      },
      {
        key: 'fechaAsignacion',
        label: 'Fecha Asignación',
        render: (lead) => formatDate(lead.fechaAsignacion),
      },
      {
        key: 'lead',
        label: 'Teléfono',
        render: (lead) => <code className={styles.phone}>{formatPhone(lead.prefijo, lead.lead)}</code>,
      },
      {
        key: 'nombreTitular',
        label: 'Titular',
        render: (lead) => <span className={styles.titular}>{lead.nombreTitular || 'Sin asignar'}</span>,
      },
      {
        key: 'correo',
        label: 'Email',
        render: (lead) =>
          lead.correo ? (
            <a href={`mailto:${lead.correo}`} className={styles.email}>
              {lead.correo}
            </a>
          ) : (
            <span className={styles.noData}>-</span>
          ),
      },
      {
        key: 'estadoSeguimiento',
        label: 'Estado Seguimiento',
        render: (lead) => (
          <Badge
            variant={getEstadoBadgeVariant(lead.estadoSeguimiento || 'NUEVO')}
            size="sm"
          >
            {lead.estadoSeguimiento || 'Nuevo'}
          </Badge>
        ),
      },
    ],
    []
  );

  const actions = useMemo<DsDataTableAction<LeadAsesorVentasResponse>[]>(
    () => [
      {
        label: 'Ver',
        variant: 'ghost',
        onClick: (lead) => onLeadClick?.(lead),
      },
      {
        label: 'Editar',
        variant: 'secondary',
        onClick: (lead) => onLeadClick?.(lead),
        isVisible: () => permisos.UPDATE_LEADS_ASESOR,
      },
      {
        label: 'Tipificar',
        variant: 'primary',
        onClick: (lead) => onLeadClick?.(lead),
        isVisible: () => permisos.TYPIFY_LEADS,
      },
    ],
    [onLeadClick, permisos.TYPIFY_LEADS, permisos.UPDATE_LEADS_ASESOR]
  );

  // ========== RENDER ==========
  if (leadsQuery.isPending) {
    return <Spinner text="Cargando leads del asesor..." />;
  }

  if (!permisos.READ_LEADS_ASESOR) {
    return (
      <Alert
        type="warning"
        message="No tienes permiso para ver leads de asesor"
      />
    );
  }

  return (
    <div className={`${styles.container} ${dashboardMode ? styles.dashboardMode : ''}`}>
      <h2 className={styles.title}>Mis Leads - Seguimiento</h2>

      {leadsQuery.isError && (
        <Alert
          type="error"
          message="Error al cargar los leads"
          dismissible
          onClose={() => leadsQuery.refetch()}
        />
      )}

      {/* BARRA DE FILTROS */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Buscar por ID, teléfono, nombre o email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />

        <select
          value={filterEstado}
          onChange={(e) => {
            setFilterEstado(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.filterSelect}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e || 'sin-estado'} value={e || ''}>
              {e || 'Sin estado'}
            </option>
          ))}
        </select>

        <button
          className={styles.clearButton}
          onClick={() => {
            setSearchTerm('');
            setFilterEstado('');
            setCurrentPage(1);
          }}
        >
          Limpiar
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className={styles.stats}>
        <span className={styles.total}>
          {filteredLeads.length} leads
        </span>
        <span className={styles.info}>
          Página {currentPage} de {totalPages || 1}
        </span>
      </div>

      {/* TABLA */}
      <div className={styles.dataGridWrap}>
        <DsDataTable
          rows={paginatedLeads}
          columns={columns}
          actions={actions}
          loading={false}
          emptyMessage={searchTerm || filterEstado ? 'No hay leads que coincidan con tu búsqueda' : 'No tienes leads asignados aún'}
          rowKey={(lead) => lead.id}
        />
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.paginationBtn}
          >
            ← Anterior
          </button>

          <span className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationBtn}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default TablaLeadsAsesorVentas;
