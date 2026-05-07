import React from 'react';
import { GrupoCapacitacionForm } from '@features/recruitment/ui/GrupoCapacitacionForm';
import { DsEyebrow, DsSectionCard } from '@shared/ui/design-system';
import styles from './GrupoCapacitacion.module.css';

const GrupoCapacitacion: React.FC = () => {
  return (
    <section className={styles.pageSection}>
      <DsSectionCard className={styles.heroCard}>
        <DsEyebrow>Reclutamiento</DsEyebrow>
        <h2 className={styles.heroTitle}>Grupo de Capacitación</h2>
        <p className={styles.heroDescription}>
          Crea y programa nuevos grupos de capacitación para la siguiente etapa del proceso.
        </p>
      </DsSectionCard>

      <GrupoCapacitacionForm />
    </section>
  );
};

export default GrupoCapacitacion;
