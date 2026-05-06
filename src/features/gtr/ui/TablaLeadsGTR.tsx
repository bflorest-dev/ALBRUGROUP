/**
 * Componente TablaLeadsGTR - Tablero de leads para supervisores GTR
 * Endpoint: GET /leads/gtr
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Badge } from '@shared/ui';
import { Spinner, Alert } from '@shared/ui/utilities/Utilities';
import { DsDataTable, type DsDataTableAction, type DsDataTableColumn } from '@shared/ui/design-system';
import { useLeadsGTR } from '../hooks/useGtrQueries';
import type { LeadGtrResponse, PermisosGTR } from '@entities/lead/types';
import styles from './TablaLeadsGTR.module.css';

interface TablaLeadsGTRProps {
  permisos: PermisosGTR;
  onReasignarClick?: (lead: LeadGtrResponse, asesores: Array<{ id: number; nombre: string }>) => void;
  onViewLead?: (lead: LeadGtrResponse) => void;
  filtros?: {
    campana?: string;
    asesor?: string;
    estado?: string;
  };
  itemsPerPage?: number;
  dashboardMode?: boolean;
}

/**
 * Tabla GTR con:
 * - Columnas: ID, fecha, campaña, proveedor, base, titular, tipificación, subtipificación, asesor, estado, reasignaciones
 * - Filtrado por campaña, asesor, estado
 * - Búsqueda
 * - Paginación
 * - Acciones: reasignar, contactar
 */
export const TablaLeadsGTR: React.FC<TablaLeadsGTRProps> = ({
  permisos,
  onReasignarClick,
  onViewLead,
  filtros,
  itemsPerPage = 20,
  dashboardMode = false,
}) => {
  // ========== ESTADO ==========
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCampaign, setFilterCampaign] = useState<string>(filtros?.campana || '');
  const [filterAsesor, setFilterAsesor] = useState<string>(filtros?.asesor || '');
  const [filterEstado, setFilterEstado] = useState<string>(filtros?.estado || '');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  // ========== QUERIES ==========
  const leadsQuery = useLeadsGTR();
  const leads = useMemo(
    () => (Array.isArray(leadsQuery.data) ? leadsQuery.data : []),
    [leadsQuery.data]
  );

  // Debug: Log para verificar si hay datos
  React.useEffect(() => {
    console.log('TablaLeadsGTR - Datos recibidos:', {
      isLoading: leadsQuery.isPending,
      isError: leadsQuery.isError,
      error: leadsQuery.error,
      leadCount: leads.length,
      leads: leads.slice(0, 3), // Primeros 3 para debug
    });
  }, [leads, leadsQuery]);

  // ========== FUNCIONES DE FILTRADO ==========
  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return leads.filter((lead) => {
      const leadText = (lead.nombreTitular ?? lead.lead ?? '').toString().toLowerCase();
      const partially = (lead.prefijo ?? '').toString().toLowerCase();
      const campana = (lead.nombreCampana ?? '').toString().toLowerCase();
      const asesor = (lead.nombreAsesorAsignado ?? '').toString().toLowerCase();
      const estado = (lead.estadoSeguimiento ?? '').toString().toLowerCase();

      const matchesSearch =
        !term ||
        lead.id.toString().includes(term) ||
        leadText.includes(term) ||
        partially.includes(term) ||
        campana.includes(term);

      const matchesCampaign = !filterCampaign || campana === filterCampaign.toLowerCase();
      const matchesAsesor = !filterAsesor || asesor === filterAsesor.toLowerCase();
      const matchesEstado = !filterEstado || estado === filterEstado.toLowerCase();

      return matchesSearch && matchesCampaign && matchesAsesor && matchesEstado;
    });
  }, [leads, searchTerm, filterCampaign, filterAsesor, filterEstado]);

  // ========== EXTRAE VALORES ÚNICOS PARA FILTROS ==========
  const campaigns = useMemo(() => {
    const unique = new Set(leads.map((l) => l.nombreCampana));
    return Array.from(unique).sort();
  }, [leads]);

  const asesores = useMemo(() => {
    const unique = new Set(leads.map((l) => l.nombreAsesorAsignado));
    return Array.from(unique).sort();
  }, [leads]);

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

  // ========== HANDLERS ==========
  const toggleSelectLead = useCallback((leadId: number) => {
    setSelectedLeads((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(leadId)) {
        newSelected.delete(leadId);
      } else {
        newSelected.add(leadId);
      }
      return newSelected;
    });
  }, []);

  const getEstadoBadgeVariant = (estado: string) => {
    const variants: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
      NUEVA: 'info',
      ASIGNADA: 'info',
      EN_SEGUIMIENTO: 'warning',
      CONTACTADA: 'success',
      TIPIFICADA: 'success',
      CERRADA: 'success',
      PERDIDA: 'error',
    };
    return variants[estado] || 'info';
  };

  const formatLeadWithPrefix = (prefijo?: string, lead?: string): string => {
    const p = String(prefijo ?? '').trim();
    const l = String(lead ?? '').trim();
    if (p && l) return `${p} ${l}`;
    return l || p || '-';
  };

  const formatDateOnly = (rawDate: string): string => {
    return new Date(rawDate).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const sanitizeCode = (value?: string | null): string => {
    const code = String(value ?? '').trim();
    if (!code) return '-';
    return code.replace(/_/g, ' ');
  };

  const allSelectedOnPage =
    paginatedLeads.length > 0 && paginatedLeads.every((lead) => selectedLeads.has(lead.id));

  const columns = useMemo<DsDataTableColumn<LeadGtrResponse>[]>(
    () => [
      {
        key: 'selected',
        label: (
          <input
            type="checkbox"
            checked={allSelectedOnPage}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedLeads(new Set(paginatedLeads.map((lead) => lead.id)));
              } else {
                setSelectedLeads(new Set());
              }
            }}
            aria-label="Seleccionar leads de la página"
          />
        ),
        align: 'center',
        render: (lead) => (
          <input
            type="checkbox"
            checked={selectedLeads.has(lead.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelectLead(lead.id);
            }}
            aria-label={`Seleccionar lead ${lead.id}`}
          />
        ),
      },
      {
        key: 'id',
        label: 'N°',
        render: (lead) => <strong>{lead.id}</strong>,
      },
      {
        key: 'lead',
        label: 'Lead',
        render: (lead) => formatLeadWithPrefix(lead.prefijo, lead.lead),
      },
      {
        key: 'createdAt',
        label: 'Fecha',
        render: (lead) => formatDateOnly(lead.createdAt),
      },
      {
        key: 'nombreCampana',
        label: 'Campaña',
      },
      {
        key: 'nombreProveedorCampana',
        label: 'Proveedor',
      },
      {
        key: 'base',
        label: 'Base',
        render: (lead) => <Badge label={lead.base} variant="info" size="sm" />,
      },
      {
        key: 'nombreTitular',
        label: 'Titular',
      },
      {
        key: 'codigoTipificacion',
        label: 'Tipificación',
        render: (lead) => sanitizeCode(lead.codigoTipificacion),
      },
      {
        key: 'codigoSubtipificacion',
        label: 'Subtipificación',
        render: (lead) => sanitizeCode(lead.codigoSubtipificacion),
      },
      {
        key: 'nombreAsesorAsignado',
        label: 'Asesor',
      },
      {
        key: 'estadoSeguimiento',
        label: 'Estado',
        render: (lead) => (
          <Badge
            label={lead.estadoSeguimiento}
            variant={getEstadoBadgeVariant(lead.estadoSeguimiento)}
            size="sm"
          />
        ),
      },
      {
        key: 'reasignaciones',
        label: 'Reasignaciones',
        render: (lead) => <strong>{lead.reasignaciones}</strong>,
      },
    ],
    [allSelectedOnPage, paginatedLeads, selectedLeads, toggleSelectLead]
  );

  const actions = useMemo<DsDataTableAction<LeadGtrResponse>[]>(
    () => [
      {
        label: 'Reasignar',
        variant: 'secondary',
        onClick: (lead) => onReasignarClick?.(lead, []),
        isVisible: () => permisos.ASSIGN_LEADS,
      },
      {
        label: 'Ver',
        variant: 'ghost',
        onClick: (lead) => onViewLead?.(lead),
        isVisible: () => permisos.ASSIGN_LEADS,
      },
      {
        label: 'Sin permiso',
        variant: 'ghost',
        onClick: () => undefined,
        disabled: () => true,
        isVisible: () => !permisos.ASSIGN_LEADS,
      },
    ],
    [onReasignarClick, onViewLead, permisos.ASSIGN_LEADS]
  );

  // ========== RENDER ==========
  if (leadsQuery.isPending) {
    return <Spinner text="Cargando leads..." />;
  }

  if (!permisos.READ_LEADS_GTR) {
    return (
      <Alert
        type="warning"
        message="No tienes permiso para ver leads GTR"
      />
    );
  }

  return (
    <div className={`${styles.container} ${dashboardMode ? styles.dashboardMode : ''}`}>
      <h2 className={styles.title}>Tablero de Leads GTR</h2>

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
          placeholder="Buscar por ID o nombre..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />

        <select
          value={filterCampaign}
          onChange={(e) => {
            setFilterCampaign(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.filterSelect}
        >
          <option value="">Todas las campañas</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filterAsesor}
          onChange={(e) => {
            setFilterAsesor(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.filterSelect}
        >
          <option value="">Todos los asesores</option>
          {asesores.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

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
            setFilterCampaign('');
            setFilterAsesor('');
            setFilterEstado('');
            setCurrentPage(1);
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* CONTADOR */}
      <div className={styles.stats}>
        <span className={styles.total}>
          {filteredLeads.length} leads encontrados
        </span>
        {selectedLeads.size > 0 && (
          <span className={styles.selected}>{selectedLeads.size} seleccionados</span>
        )}
      </div>

      {/* TABLA */}
      <div className={styles.dataGridWrap}>
        <DsDataTable
          rows={paginatedLeads}
          columns={columns}
          actions={actions}
          loading={false}
          emptyMessage={
            leadsQuery.isError
              ? `Error al cargar leads: ${leadsQuery.error?.message || 'Desconocido'}`
              : 'No hay leads para mostrar'
          }
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

export default TablaLeadsGTR;
