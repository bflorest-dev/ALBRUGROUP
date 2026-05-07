import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SessionLogoutButton } from '@shared/ui';
import { useBandejaLeads } from '@features/sales-advisor/hooks';
import {
  TablaLeadsAsesorVentas,
  DetalleLeadModal,
} from '@features/sales-advisor/ui';
import { PreventaLeadModal } from '@features/presales/ui/PreventaLeadModal';
import type { LeadAsesorVentasResponse } from '@features/sales-advisor/model';
import styles from './PaginaAsesores.module.css';

/**
 * Página principal del Asesor de Ventas
 * Gestiona la bandeja de leads asignados y operaciones según los 6 endpoints:
 * - GET /preventa/asesor-ventas (carga inicial)
 * - POST /preventa/{idLead}/contacto
 * - POST /preventa/{idLead}/tipificacion
 * - PATCH /preventa/{idLead}/oferta-comercial
 * - PATCH /preventa/{idLead}/direccion
 * - PATCH /preventa/{idLead}/datos-preventa
 */
const PaginaAsesores: React.FC = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname === '/ventas/dashboard';
  const [selectedLead, setSelectedLead] = useState<LeadAsesorVentasResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeadPreventa, setSelectedLeadPreventa] = useState<LeadAsesorVentasResponse | null>(null);
  const [showPreventaModal, setShowPreventaModal] = useState(false);

  const { data: leads = [], isLoading, error, refetch } = useBandejaLeads();
  const safeLeads = Array.isArray(leads) ? leads : [];

  const handleSelectLead = (lead: LeadAsesorVentasResponse) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handlePreventaLead = (lead: LeadAsesorVentasResponse) => {
    setSelectedLeadPreventa(lead);
    setShowPreventaModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    refetch();
  };

  return (
    <div className={styles.dashboardShell}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Mi Bandeja de Leads</h1>
            <p className={styles.subtitle}>
              Gestiona tus leads asignados: contactos, tipificación, ofertas comerciales y datos de
              preventa
            </p>
          </div>
          <SessionLogoutButton />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorAlert}>
          Error al cargar leads: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {/* Stats */}
      {!isLoading && leads.length > 0 && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Leads</p>
            <p className={styles.statValue}>{leads.length}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Nuevos</p>
            <p className={styles.statValue}>
              {leads.filter((l) => l.estadoSeguimiento === 'NUEVO').length}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>En Contacto</p>
            <p className={styles.statValue}>
              {leads.filter((l) => l.estadoSeguimiento === 'EN_CONTACTO').length}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Tipificados</p>
            <p className={styles.statValue}>
              {leads.filter((l) => l.estadoSeguimiento === 'TIPIFICADO').length}
            </p>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className={styles.toolbar}>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className={styles.refreshButton}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar Bandeja'}
        </button>
      </div>

      {/* Leads Table */}
      <div className={styles.leadsPanel}>
        <TablaLeadsAsesorVentas
          leads={safeLeads}
          isLoading={isLoading}
          dashboardMode={isDashboardRoute}
          onSelectLead={handleSelectLead}
          onPreventa={handlePreventaLead}
        />
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <DetalleLeadModal
          lead={selectedLead}
          isOpen={showModal}
          dashboardMode={isDashboardRoute}
          onClose={handleCloseModal}
        />
      )}

      {selectedLeadPreventa && (
        <PreventaLeadModal
          idLead={selectedLeadPreventa.id}
          isOpen={showPreventaModal}
          dashboardMode={isDashboardRoute}
          onClose={() => {
            setShowPreventaModal(false);
            setSelectedLeadPreventa(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default PaginaAsesores;
