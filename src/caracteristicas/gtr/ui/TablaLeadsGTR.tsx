/**
 * Componente TablaLeadsGTR - Tablero de leads para supervisores GTR
 * Endpoint: GET /leads/gtr
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState, useMemo } from 'react';
import { Badge, Spinner, Alert, Button } from '@shared/ui/utilities/Utilities';
import { useLeadsGTR, useContactLeadMutation, useAssignLeadMutation } from '../hooks/useGtrQueries';
import type { LeadGtrResponse, PermisosGTR } from '@entidades/lead/types';
import styles from './TablaLeadsGTR.module.css';

interface TablaLeadsGTRProps {
  permisos: PermisosGTR;
  onReasignarClick?: (lead: LeadGtrResponse, asesores: Array<{ id: number; nombre: string }>) => void;
  filtros?: {
    campana?: string;
    asesor?: string;
    estado?: string;
  };
  itemsPerPage?: number;
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
  filtros,
  itemsPerPage = 20,
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
  const leads = leadsQuery.data ?? [];

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

  // ========== MUTACIONES ==========
  const contactMutation = useContactLeadMutation();

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
  const handleContactLead = async (leadId: number) => {
    try {
      await contactMutation.mutateAsync(leadId);
    } catch (error) {
      console.error('Error contacting lead:', error);
    }
  };

  const toggleSelectLead = (leadId: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const getEstadoBadgeVariant = (estado: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      NUEVA: 'info',
      ASIGNADA: 'primary',
      EN_SEGUIMIENTO: 'warning',
      CONTACTADA: 'success',
      TIPIFICADA: 'success',
      CERRADA: 'success',
      PERDIDA: 'danger',
    };
    return variants[estado] || 'primary';
  };

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
    <div className={styles.container}>
      <h2>Tablero de Leads GTR</h2>

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
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colCheckbox}>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLeads(new Set(paginatedLeads.map((l) => l.id)));
                    } else {
                      setSelectedLeads(new Set());
                    }
                  }}
                />
              </th>
              <th className={styles.colId}>ID</th>
              <th className={styles.colPrefijo}>Prefijo</th>
              <th className={styles.colLead}>Lead</th>
              <th className={styles.colFecha}>Fecha</th>
              <th className={styles.colCampana}>Campaña</th>
              <th className={styles.colProveedor}>Proveedor</th>
              <th className={styles.colBase}>Base</th>
              <th className={styles.colTitular}>Titular</th>
              <th className={styles.colTipificacion}>Tipificación</th>
              <th className={styles.colSubtipificacion}>Subtipificación</th>
              <th className={styles.colAsesor}>Asesor</th>
              <th className={styles.colEstado}>Estado</th>
              <th className={styles.colReasignaciones}>Reasignaciones</th>
              <th className={styles.colAcciones}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={13} className={styles.noData}>
                  {leadsQuery.isPending ? (
                    'Cargando leads...'
                  ) : leadsQuery.isError ? (
                    `Error al cargar leads: ${leadsQuery.error?.message || 'Desconocido'}`
                  ) : (
                    'No hay leads para mostrar'
                  )}
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr key={lead.id} className={styles.row}>
                  <td className={styles.colCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => toggleSelectLead(lead.id)}
                    />
                  </td>
                  <td className={styles.colId}><strong>#{lead.id}</strong></td>
                  <td className={styles.colPrefijo}>{lead.prefijo || '-'}</td>
                  <td className={styles.colLead}>{lead.lead || '-'}</td>
                  <td className={styles.colFecha}>
                    {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </td>
                  <td className={styles.colCampana}>{lead.nombreCampana}</td>
                  <td className={styles.colProveedor}>{lead.nombreProveedorCampana}</td>
                  <td className={styles.colBase}>
                    <Badge label={lead.base} variant="info" size="small" />
                  </td>
                  <td className={styles.colTitular}>{lead.nombreTitular}</td>
                  <td className={styles.colTipificacion}>{lead.codigoTipificacion || '-'}</td>
                  <td className={styles.colSubtipificacion}>
                    {lead.codigoSubtipificacion || '-'}
                  </td>
                  <td className={styles.colAsesor}>{lead.nombreAsesorAsignado}</td>
                  <td className={styles.colEstado}>
                    <Badge
                      label={lead.estadoSeguimiento}
                      variant={getEstadoBadgeVariant(lead.estadoSeguimiento)}
                      size="small"
                    />
                  </td>
                  <td className={styles.colReasignaciones}>
                    <strong>{lead.reasignaciones}</strong>
                  </td>
                  <td className={styles.colAcciones}>
                    <div className={styles.actionButtons}>
                      {permisos.ASSIGN_LEADS && (
                        <button
                          className={styles.actionBtn}
                          title="Reasignar"
                          onClick={() => onReasignarClick?.(lead, [])}
                          disabled={false}
                        >
                          🔄
                        </button>
                      )}
                      {permisos.CONTACT_LEADS && (
                        <button
                          className={styles.actionBtn}
                          title="Contactar"
                          onClick={() => handleContactLead(lead.id)}
                          disabled={contactMutation.isPending}
                        >
                          ☎️
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

export default TablaLeadsGTR;
