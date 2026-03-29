/**
 * Componente TablaLeadsAsesorVentas - Bandeja de leads para asesor de ventas
 * Endpoint: GET /leads/leads/asesor-ventas
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState, useMemo } from 'react';
import { Badge, Spinner, Alert, Button } from '@shared/ui/utilities/Utilities';
import { useLeadsAsesorVentas, useTypifyLeadMutation } from '../hooks/useGtrQueries';
import type { LeadAsesorVentasResponse, PermisosGTR } from '@entidades/lead/types';
import styles from './TablaLeadsAsesorVentas.module.css';

interface TablaLeadsAsesorVentasProps {
  permisos: PermisosGTR;
  idAsesor?: number;
  onLeadClick?: (lead: LeadAsesorVentasResponse) => void;
  itemsPerPage?: number;
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
        lead.nombreTitular.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.correo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = !filterEstado || lead.estadoSeguimiento === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [leads, searchTerm, filterEstado]);

  // ========== VALORES ÚNICOS PARA FILTROS ==========
  const estados = useMemo(() => {
    const unique = new Set(leads.map((l) => l.estadoSeguimiento));
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
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      NUEVO: 'info',
      EN_SEGUIMIENTO: 'warning',
      CONTACTADO: 'primary',
      INTERESADO: 'success',
      NO_INTERESADO: 'danger',
      SIN_RESPUESTA: 'warning',
      TIPIFICADO: 'success',
      CERRADO: 'success',
    };
    return variants[estado] || 'primary';
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
    <div className={styles.container}>
      <h2>Mis Leads - Seguimiento</h2>

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
            <option key={e} value={e}>
              {e}
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
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colId}>ID</th>
              <th className={styles.colFecha}>Fecha Asignación</th>
              <th className={styles.colTelefono}>Teléfono</th>
              <th className={styles.colTitular}>Titular</th>
              <th className={styles.colEmail}>Email</th>
              <th className={styles.colEstado}>Estado Seguimiento</th>
              <th className={styles.colAcciones}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.noData}>
                  {searchTerm || filterEstado ? (
                    <>No hay leads que coincidan con tu búsqueda</>
                  ) : (
                    <>No tienes leads asignados aún</>
                  )}
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr key={lead.id} className={styles.row}>
                  <td className={styles.colId}>
                    <strong>#{lead.id}</strong>
                  </td>
                  <td className={styles.colFecha}>
                    {formatDate(lead.fechaAsignacion)}
                  </td>
                  <td className={styles.colTelefono}>
                    <code className={styles.phone}>
                      {formatPhone(lead.prefijo, lead.lead)}
                    </code>
                  </td>
                  <td className={styles.colTitular}>
                    <span className={styles.titular}>{lead.nombreTitular}</span>
                  </td>
                  <td className={styles.colEmail}>
                    {lead.correo ? (
                      <a href={`mailto:${lead.correo}`} className={styles.email}>
                        {lead.correo}
                      </a>
                    ) : (
                      <span className={styles.noData}>-</span>
                    )}
                  </td>
                  <td className={styles.colEstado}>
                    <Badge
                      label={lead.estadoSeguimiento}
                      variant={getEstadoBadgeVariant(lead.estadoSeguimiento)}
                      size="small"
                    />
                  </td>
                  <td className={styles.colAcciones}>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionBtn}
                        title="Ver detalles"
                        onClick={() => onLeadClick?.(lead)}
                      >
                        👁️
                      </button>

                      {permisos.UPDATE_LEADS_ASESOR && (
                        <button
                          className={styles.actionBtn}
                          title="Actualizar estado"
                          onClick={() => onLeadClick?.(lead)}
                        >
                          ✏️
                        </button>
                      )}

                      {permisos.TYPIFY_LEADS && (
                        <button
                          className={styles.actionBtn}
                          title="Tipificar"
                          onClick={() => onLeadClick?.(lead)}
                        >
                          🏷️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
