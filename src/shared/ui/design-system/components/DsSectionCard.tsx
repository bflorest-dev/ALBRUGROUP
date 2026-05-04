import React from 'react';
import { cn } from './cn';
import { DsCard } from './DsCard';
import styles from './dsPrimitives.module.css';

interface DsSectionCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DsSectionCard: React.FC<DsSectionCardProps> = ({
  title,
  description,
  actions,
  children,
  className,
}) => {
  return (
    <DsCard className={className}>
      {title || description || actions ? (
        <header className={styles.cardHeader}>
          <div>
            {title ? <h2 className={styles.cardTitle}>{title}</h2> : null}
            {description ? <p className={styles.cardDescription}>{description}</p> : null}
          </div>
          {actions ? <div className={cn(styles.cardActions, 'shrink-0')}>{actions}</div> : null}
        </header>
      ) : null}

      {children}
    </DsCard>
  );
};
