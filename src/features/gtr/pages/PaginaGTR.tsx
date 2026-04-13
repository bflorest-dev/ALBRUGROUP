import React, { useState } from 'react';
import { useAuth } from '@entities/auth';
import { useAsesoresVentasConectados } from '@shared/hooks/useAsesoresConectados';
import { AltaLead, AsignacionLead, TablaLeadsGTR, TablaLeadsAsesorVentas, DetallesLeadModal } from '../ui';
import type { PermisosGTR, LeadGtrResponse } from '@entities/lead/types';
import styles from './PaginaGTR.module.css';

/**
 * Página principal de GTR
 * Intake de leads, visualización y asignación a asesores de ventas
 */
const PaginaGTR: React.FC = () => {
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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>GTR - Gestión de Leads</h1>
        <p className={styles.subtitle}>Intake, asignación y seguimiento de leads</p>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'bandeja' ? styles.active : ''}`}
          onClick={() => setActiveTab('bandeja')}
          disabled={!isGtrSupervisor}
        >
          📊 Tablero General
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'intakeLead' ? styles.active : ''}`}
          onClick={() => setActiveTab('intakeLead')}
          disabled={!permisos.CREATE_LEADS}
        >
          ➕ Nuevo Lead
        </button>
        {isAsesorVentas && (
          <button
            className={`${styles.tab} ${activeTab === 'misBandejas' ? styles.active : ''}`}
            onClick={() => setActiveTab('misBandejas')}
          >
            📋 Mis Leads
          </button>
        )}
        {isAsesorGTR && (
          <button
            className={`${styles.tab} ${activeTab === 'registros' ? styles.active : ''}`}
            onClick={() => setActiveTab('registros')}
          >
            📝 Leads Registrados
          </button>
        )}
      </nav>

      <main className={styles.content}>
        {/* Tablero General - GTR Supervisors */}
        {activeTab === 'bandeja' && (
          <section className={styles.section}>
            {!isGtrSupervisor ? (
              <div className={styles.alert} style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107' }}>
                <strong>⚠️ Acceso Limitado</strong>
                <p>No tienes permisos para ver el tablero general de GTR. Contacta con administración.</p>
              </div>
            ) : (
              <>
                <h2>Tablero de Supervisión</h2>
                <TablaLeadsGTR
                  permisos={permisos}
                  onReasignarClick={(lead) => setSelectedLeadForReasignacion(lead)}
                  onViewLead={(lead) => setSelectedLeadForDetalles(lead)}
                />
              </>
            )}
          </section>
        )}

        {/* Nuevo Lead - Alta Lead */}
        {activeTab === 'intakeLead' && (
          <section className={styles.section}>
            {!permisos.CREATE_LEADS ? (
              <div className={styles.alert} style={{ backgroundColor: '#f8d7da', borderColor: '#f5c6cb' }}>
                <strong>❌ Permiso Denegado</strong>
                <p>No tienes permisos para crear nuevos leads.</p>
              </div>
            ) : (
              <>
                <h2>Registrar Nuevo Lead</h2>
                <div className={styles.cardContainer}>
                  <AltaLead
                    permisos={permisos}
                    onSuccess={() => {
                      setActiveTab(isAsesorGTR ? 'registros' : 'bandeja');
                      // Toast notification would go here
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
          <section className={styles.section}>
            <h2>Mis Leads Asignados</h2>
            <TablaLeadsAsesorVentas
              permisos={permisos}
              idAsesor={currentUser?.id ? parseInt(currentUser.id) : undefined}
              onLeadClick={(lead) => {
                // Could open detail modal here
                console.log('Lead clicked:', lead);
              }}
            />
          </section>
        )}

        {/* Leads Registrados para ASESOR_GTR */}
        {activeTab === 'registros' && isAsesorGTR && (
          <section className={styles.section}>
            <h2>Leads Registrados</h2>
            {permisos.READ_LEADS_GTR ? (
              <TablaLeadsGTR
                permisos={permisos}
                onReasignarClick={(lead) => setSelectedLeadForReasignacion(lead)}
                onViewLead={(lead) => setSelectedLeadForDetalles(lead)}
              />
            ) : (
              <div className={styles.alert} style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107' }}>
                <strong>⚠️ Acceso Limitado</strong>
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
          onClose={() => setSelectedLeadForDetalles(null)}
        />
      )}

      {/* Asignación Lead Modal - Reasignar */}
      {selectedLeadForReasignacion && (
        <div className={styles.overlay} onClick={() => setSelectedLeadForReasignacion(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedLeadForReasignacion(null)}>
              ✕
            </button>
            <h3>Reasignar Lead #{selectedLeadForReasignacion.id}</h3>
            {loadingAsesores && <p style={{ textAlign: 'center', color: '#666' }}>Cargando asesores disponibles...</p>}
            <AsignacionLead
              idLead={selectedLeadForReasignacion.id}
              nombreLeadActual={selectedLeadForReasignacion.nombreTitular}
              asesorActual={selectedLeadForReasignacion.nombreAsesorAsignado ? { id: 0, nombre: selectedLeadForReasignacion.nombreAsesorAsignado } : undefined}
              asesoresDisponibles={asesoresDisponibles}
              permisos={permisos}
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
