import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@entities/auth';
import { SessionLogoutButton } from '@shared/ui';
import { useAsesoresVentasConectados } from '@shared/hooks/useAsesoresConectados';
import { AltaLead, AsignacionLead, TablaLeadsGTR, TablaLeadsAsesorVentas, DetallesLeadModal } from '@features/gtr/ui';
import type { PermisosGTR, LeadGtrResponse } from '@entities/lead/types';
import styles from './PaginaGTR.module.css';

/**
 * Página principal de GTR
 * Intake de leads, visualización y asignación a asesores de ventas
 */
const PaginaGTR: React.FC = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname === '/gtr/dashboard';
  const { currentUser } = useAuth();
  const { data: asesoresDisponibles = [], isLoading: loadingAsesores } = useAsesoresVentasConectados();
  const [activeTab, setActiveTab] = useState<'bandeja' | 'intakeLead' | 'misBandejas' | 'registros'>('bandeja');
  const [selectedLeadForReasignacion, setSelectedLeadForReasignacion] = useState<LeadGtrResponse | null>(null);
  const [selectedLeadForDetalles, setSelectedLeadForDetalles] = useState<LeadGtrResponse | null>(null);

  const userRoles = currentUser?.roles ?? [];
  const isGtrSupervisor = userRoles.includes('GTR') || userRoles.includes('ADMINISTRADOR');
  const isAsesorVentas = userRoles.includes('ASESOR_DE_VENTAS');
  const isAsesorGTR = userRoles.includes('ASESOR_GTR');

  const permisos: PermisosGTR = {
    READ_CAMPANA: true,
    READ_ZONAS: true,
    READ_UBIGEO: true,
    READ_PLANES: true,
    READ_ADICIONALES: true,
    READ_PROMOCIONES: true,
    READ_TIPIFICACIONES_PREVENTA: true,
    CREATE_LEADS: true,
    ASSIGN_LEADS: isGtrSupervisor || isAsesorGTR,
    READ_LEADS_ASESOR: true,
    UPDATE_LEADS_ASESOR: true,
    TYPIFY_LEADS: true,
    CONTACT_LEADS: isGtrSupervisor || isAsesorGTR,
    READ_LEADS_GTR: isGtrSupervisor || isAsesorGTR,
    READ_EVENTOS_LEADS: true,
  };

  return (
    <div className={`${styles.container} ${isDashboardRoute ? styles.dashboardMode : ''}`}>
      <header className={`${styles.header} ${isDashboardRoute ? styles.dashboardHeader : ''}`}>
        <div className={styles.headerRow}>
          <div>
            <h1>GTR - Gestión de Leads</h1>
            <p className={styles.subtitle}>Intake, asignación y seguimiento de leads</p>
          </div>
          <SessionLogoutButton />
        </div>
      </header>

      <nav className={`${styles.tabs} ${isDashboardRoute ? styles.dashboardTabs : ''}`}>
        <button
          className={`${styles.tab} ${activeTab === 'bandeja' ? styles.active : ''} ${isDashboardRoute ? styles.dashboardTab : ''}`}
          onClick={() => setActiveTab('bandeja')}
          disabled={!isGtrSupervisor}
        >
          {isDashboardRoute ? 'Tablero General' : '📊 Tablero General'}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'intakeLead' ? styles.active : ''} ${isDashboardRoute ? styles.dashboardTab : ''}`}
          onClick={() => setActiveTab('intakeLead')}
          disabled={!permisos.CREATE_LEADS}
        >
          {isDashboardRoute ? 'Nuevo Lead' : '➕ Nuevo Lead'}
        </button>
        {isAsesorVentas && (
          <button
            className={`${styles.tab} ${activeTab === 'misBandejas' ? styles.active : ''} ${isDashboardRoute ? styles.dashboardTab : ''}`}
            onClick={() => setActiveTab('misBandejas')}
          >
            {isDashboardRoute ? 'Mis Leads' : '📋 Mis Leads'}
          </button>
        )}
        {isAsesorGTR && (
          <button
            className={`${styles.tab} ${activeTab === 'registros' ? styles.active : ''} ${isDashboardRoute ? styles.dashboardTab : ''}`}
            onClick={() => setActiveTab('registros')}
          >
            {isDashboardRoute ? 'Leads Registrados' : '📝 Leads Registrados'}
          </button>
        )}
      </nav>

      <main className={`${styles.content} ${isDashboardRoute ? styles.dashboardContent : ''}`}>
        {/* Tablero General - GTR Supervisors */}
        {activeTab === 'bandeja' && (
          <section className={`${styles.section} ${isDashboardRoute ? styles.dashboardSection : ''}`}>
            {!isGtrSupervisor ? (
              <div className={`${styles.alert} ${styles.warningAlert}`}>
                <strong>{isDashboardRoute ? 'Acceso limitado' : '⚠️ Acceso Limitado'}</strong>
                <p>No tienes permisos para ver el tablero general de GTR. Contacta con administración.</p>
              </div>
            ) : (
              <>
                <h2 className={styles.sectionTitle}>Tablero de Supervisión</h2>
                <TablaLeadsGTR
                  permisos={permisos}
                  dashboardMode={isDashboardRoute}
                  onReasignarClick={(lead) => setSelectedLeadForReasignacion(lead)}
                  onViewLead={(lead) => setSelectedLeadForDetalles(lead)}
                />
              </>
            )}
          </section>
        )}

        {/* Nuevo Lead - Alta Lead */}
        {activeTab === 'intakeLead' && (
          <section className={`${styles.section} ${isDashboardRoute ? styles.dashboardSection : ''}`}>
            {!permisos.CREATE_LEADS ? (
              <div className={`${styles.alert} ${styles.errorAlert}`}>
                <strong>{isDashboardRoute ? 'Permiso denegado' : '❌ Permiso Denegado'}</strong>
                <p>No tienes permisos para crear nuevos leads.</p>
              </div>
            ) : (
              <>
                <h2 className={styles.sectionTitle}>Registrar Nuevo Lead</h2>
                <div className={`${styles.formPanel} ${isDashboardRoute ? styles.dashboardFormPanel : ''}`}>
                  <AltaLead
                    permisos={permisos}
                    dashboardMode={isDashboardRoute}
                    onSuccess={() => {
                      setActiveTab(isAsesorGTR ? 'registros' : 'bandeja');
                      alert('Lead creado exitosamente');
                    }}
                  />
                </div>
              </>
            )}
          </section>
        )}

        {/* Mis Leads - Asesor Ventas */}
        {activeTab === 'misBandejas' && (
          <section className={`${styles.section} ${isDashboardRoute ? styles.dashboardSection : ''}`}>
            <h2 className={styles.sectionTitle}>Mis Leads Asignados</h2>
            <TablaLeadsAsesorVentas
              permisos={permisos}
              dashboardMode={isDashboardRoute}
              idAsesor={currentUser?.id ? parseInt(currentUser.id) : undefined}
              onLeadClick={(lead) => {
                console.log('Lead clicked:', lead);
              }}
            />
          </section>
        )}

        {/* Leads Registrados para ASESOR_GTR */}
        {activeTab === 'registros' && isAsesorGTR && (
          <section className={`${styles.section} ${isDashboardRoute ? styles.dashboardSection : ''}`}>
            <h2 className={styles.sectionTitle}>Leads Registrados</h2>
            {permisos.READ_LEADS_GTR ? (
              <TablaLeadsGTR
                permisos={permisos}
                dashboardMode={isDashboardRoute}
                onReasignarClick={(lead) => setSelectedLeadForReasignacion(lead)}
                onViewLead={(lead) => setSelectedLeadForDetalles(lead)}
              />
            ) : (
              <div className={`${styles.alert} ${styles.warningAlert}`}>
                <strong>{isDashboardRoute ? 'Acceso limitado' : '⚠️ Acceso Limitado'}</strong>
                <p>No tienes permisos para ver los leads de GTR.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Detalles Lead Modal - Ver más */}
      {selectedLeadForDetalles && (
        <DetallesLeadModal
          lead={selectedLeadForDetalles}
          dashboardMode={isDashboardRoute}
          onClose={() => setSelectedLeadForDetalles(null)}
        />
      )}

      {/* Asignación Lead Modal - Reasignar */}
      {selectedLeadForReasignacion && (
        <div className={`${styles.overlay} ${isDashboardRoute ? styles.dashboardOverlay : ''}`} onClick={() => setSelectedLeadForReasignacion(null)}>
          <div className={`${styles.modal} ${isDashboardRoute ? styles.dashboardModal : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedLeadForReasignacion(null)}>
              ✕
            </button>
            <h3 className={styles.modalTitle}>Reasignar Lead #{selectedLeadForReasignacion.id}</h3>
            {loadingAsesores && <p className={styles.loadingAsesoresText}>Cargando asesores disponibles...</p>}
            <AsignacionLead
              idLead={selectedLeadForReasignacion.id}
              nombreLeadActual={selectedLeadForReasignacion.nombreTitular}
              asesorActual={selectedLeadForReasignacion.nombreAsesorAsignado ? { id: 0, nombre: selectedLeadForReasignacion.nombreAsesorAsignado } : undefined}
              asesoresDisponibles={asesoresDisponibles}
              permisos={permisos}
              dashboardMode={isDashboardRoute}
              onSuccess={(asesorNombre) => {
                setSelectedLeadForReasignacion(null);
                alert(`Lead reasignado a ${asesorNombre}`);
              }}
              onCancel={() => setSelectedLeadForReasignacion(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaGTR;
