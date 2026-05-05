import React, { useState } from 'react';
import { DsTabs } from '@shared/ui/design-system';
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
      <DsTabs
        value={activeTab}
        onChange={setActiveTab}
        items={TAB_ITEMS.map((tab) => ({ value: tab.id, label: tab.label }))}
        className={`${styles.tabs} rrhh-tabs-theme`}
      />

      <div className={styles.contentPane}>
        {activeTab === 'BANDEJA_RECLUTAMIENTO' ? (
          <BandejaReclutamiento />
        ) : (
          <GrupoCapacitacion />
        )}
      </div>
    </div>
  );
};

export default ReclutamientoPage;
