import React from 'react';
import { dsTokens } from '../tokens';
import { cn } from './cn';
import styles from './dsPrimitives.module.css';

export interface DsStatItem {
  label: string;
  value: React.ReactNode;
  helper?: string;
}

interface DsStatGridProps {
  items: DsStatItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const columnsClassMap: Record<NonNullable<DsStatGridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
};

export const DsStatGrid: React.FC<DsStatGridProps> = ({
  items,
  columns = 4,
  className,
}) => {
  const c = dsTokens.color;
  const cssVars: React.CSSProperties & Record<string, string> = {
    '--ds-stat-border': c.border,
    '--ds-stat-bg': `linear-gradient(180deg, ${c.surface} 0%, ${c.primarySoft} 100%)`,
    '--ds-stat-label-fg': c.textMuted,
    '--ds-stat-value-fg': c.textStrong,
    '--ds-stat-helper-fg': c.textMuted,
  };

  return (
    <div className={cn(`grid gap-3 ${columnsClassMap[columns]}`, className)}>
      {items.map((item) => (
        <article
          key={item.label}
          className={styles.statCard}
          style={cssVars}
        >
          <p className={cn('text-xs font-bold uppercase tracking-[0.06em]', styles.statLabel)}>{item.label}</p>
          <p className={cn('mt-1 text-2xl font-extrabold', styles.statValue)}>{item.value}</p>
          {item.helper ? <p className={cn('mt-1 text-xs', styles.statHelper)}>{item.helper}</p> : null}
        </article>
      ))}
    </div>
  );
};
