import React from 'react';
import { AppShell } from '@app/layout/AppShell';
import { DsSectionCard } from '@shared/ui/design-system';
import styles from './PaginaPanel.module.css';

const PaginaPanel: React.FC = () => {
  return (
    <AppShell>
      <div className={styles.container}>
        <DsSectionCard
          title="Panel Administrativo"
          description="Bienvenido al panel administrativo"
        >
          <p className={styles.placeholderText}>Selecciona un módulo desde la barra lateral para comenzar.</p>
        </DsSectionCard>
      </div>
    </AppShell>
  );
};

export default PaginaPanel;
