import React, { useState } from 'react';
import { SessionLogoutButton } from '@shared/ui';
import BandejaReclutamiento from './BandejaReclutamiento';
import GrupoCapacitacion from './GrupoCapacitacion';
import styles from './ReclutamientoPage.module.css';

type ReclutamientoTab = 'BANDEJA_RECLUTAMIENTO' | 'GRUPO_CAPACITACION';

const TAB_ITEMS: Array<{ id: ReclutamientoTab; label: string }> = [
  { id: 'BANDEJA_RECLUTAMIENTO', label: 'Bandeja de Reclutamiento' },
  { id: 'GRUPO_CAPACITACION', label: 'Grupo de Capacitación' },
];

const ReclutamientoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReclutamientoTab>('BANDEJA_RECLUTAMIENTO');

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>Reclutamiento</p>
            <h1>Reclutamiento</h1>
            <p className={styles.subtitle}>Gestiona la bandeja de reclutamiento y grupos de capacitación.</p>
          </div>
          <SessionLogoutButton />
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Secciones de reclutamiento">
        {TAB_ITEMS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              aria-pressed={isActive}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className={styles.content}>
        {activeTab === 'BANDEJA_RECLUTAMIENTO' ? (
          <BandejaReclutamiento />
        ) : (
          <GrupoCapacitacion />
        )}
      </main>
    </div>
  );
};

export default ReclutamientoPage;
