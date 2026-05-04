import React from 'react';
import { dsTokens } from '../tokens';
import { cn } from './cn';
import styles from './dsPrimitives.module.css';

type DsInlineMessageTone = 'info' | 'success' | 'warning' | 'danger';

interface DsInlineMessageProps {
  tone?: DsInlineMessageTone;
  children: React.ReactNode;
  className?: string;
}

const toneClassMap: Record<DsInlineMessageTone, string | undefined> = {
  info: styles.inlineMessageInfo,
  success: styles.inlineMessageSuccess,
  warning: styles.inlineMessageWarning,
  danger: styles.inlineMessageDanger,
};

export const DsInlineMessage: React.FC<DsInlineMessageProps> = ({
  tone = 'info',
  children,
  className,
}) => {
  const c = dsTokens.color;
  const cssVars: React.CSSProperties & Record<string, string> = {
    '--ds-inline-info-border': c.borderSoft,
    '--ds-inline-info-bg': c.primarySoft,
    '--ds-inline-info-fg': c.primary,
    '--ds-inline-success-border': c.successText,
    '--ds-inline-success-bg': c.successBg,
    '--ds-inline-success-fg': c.successText,
    '--ds-inline-warning-border': c.warningText,
    '--ds-inline-warning-bg': c.warningBg,
    '--ds-inline-warning-fg': c.warningText,
    '--ds-inline-danger-border': c.dangerText,
    '--ds-inline-danger-bg': c.dangerBg,
    '--ds-inline-danger-fg': c.dangerText,
  };

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm font-medium',
        styles.inlineMessageBase,
        toneClassMap[tone],
        className
      )}
      style={cssVars}
    >
      {children}
    </div>
  );
};
