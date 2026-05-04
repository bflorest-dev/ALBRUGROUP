import React from 'react';
import { Badge } from '@shared/ui';
import styles from './ReclutamientoStatusCard.module.css';

interface ReclutamientoStatusCardProps {
  title: string;
  value: number;
  subtitle: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const ReclutamientoStatusCard: React.FC<ReclutamientoStatusCardProps> = ({
  title,
  value,
  subtitle,
  variant = 'default',
}) => {
  return (
    <article className={styles.card}>
      <div className={styles.topLine} />
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
        </div>
        <Badge
          variant={variant}
          size="sm"
          className={styles.badge}
        >
          {variant.toUpperCase()}
        </Badge>
      </div>

      <div className={styles.footer}>
        <span className={styles.dot} aria-hidden="true" />
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </article>
  );
};
