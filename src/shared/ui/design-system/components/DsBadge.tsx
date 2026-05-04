import React from 'react';
import { dsTokens } from '../tokens';
import styles from './dsPrimitives.module.css';
import { cn } from './cn';

export type DsBadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';
export type DsBadgeSize = 'sm' | 'md' | 'lg';

interface DsBadgeProps {
  label: React.ReactNode;
  variant?: DsBadgeVariant;
  size?: DsBadgeSize;
  className?: string;
}

const sizeClassMap: Record<DsBadgeSize, string | undefined> = {
  sm: styles.badgeSm,
  md: styles.badgeMd,
  lg: styles.badgeLg,
};

const getVariantVars = (
  variant: DsBadgeVariant
): React.CSSProperties & Record<string, string> => {
  const c = dsTokens.color;

  switch (variant) {
    case 'success':
      return {
        '--ds-badge-bg': c.successBg,
        '--ds-badge-border': c.successText,
        '--ds-badge-fg': c.successText,
      };
    case 'warning':
      return {
        '--ds-badge-bg': c.warningBg,
        '--ds-badge-border': c.warningText,
        '--ds-badge-fg': c.warningText,
      };
    case 'error':
      return {
        '--ds-badge-bg': c.dangerBg,
        '--ds-badge-border': c.dangerText,
        '--ds-badge-fg': c.dangerText,
      };
    case 'neutral':
      return {
        '--ds-badge-bg': c.surface,
        '--ds-badge-border': c.border,
        '--ds-badge-fg': c.textDefault,
      };
    case 'info':
    default:
      return {
        '--ds-badge-bg': c.primarySoft,
        '--ds-badge-border': c.primary,
        '--ds-badge-fg': c.primary,
      };
  }
};

export const DsBadge: React.FC<DsBadgeProps> = ({
  label,
  variant = 'info',
  size = 'md',
  className,
}) => {
  return (
    <span
      className={cn(styles.badgeBase, sizeClassMap[size], className)}
      style={getVariantVars(variant)}
    >
      {label}
    </span>
  );
};
