import React from 'react';

import { dsTokens } from '../tokens';

import { cn } from './cn';

import styles from './dsPrimitives.module.css';

interface DsEyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export const DsEyebrow: React.FC<DsEyebrowProps> = ({ children, className }) => {
  const c = dsTokens.color;
  const cssVars: React.CSSProperties & Record<string, string> = {
    '--ds-eyebrow-color': c.textMuted,
  };

  return (
    <p
      className={cn(
        'text-xs font-bold uppercase tracking-[0.12em]',
        styles.eyebrowText,
        className
      )}
      style={cssVars}
    >
      {children}
    </p>
  );
};
