import React from 'react';
import { dsTokens } from '../tokens';
import styles from './dsPrimitives.module.css';
import { cn } from './cn';

interface DsCardProps {
  children: React.ReactNode;
  className?: string;
}

export const DsCard: React.FC<DsCardProps> = ({ children, className }) => {
  const c = dsTokens.color;
  const s = dsTokens.shadow;

  const cssVars: React.CSSProperties & Record<string, string> = {
    '--ds-card-border': c.border,
    '--ds-card-bg': c.surface,
    '--ds-card-shadow': s.card,
    '--ds-card-title': c.textStrong,
    '--ds-card-description': c.textMuted,
  };

  return (
    <section className={cn(styles.cardBase, className)} style={cssVars}>
      {children}
    </section>
  );
};
