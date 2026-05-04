import React from 'react';
import { DsBadge, type DsBadgeVariant } from './DsBadge';

type DsStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface DsStatusBadgeProps {
  label: React.ReactNode;
  tone?: DsStatusTone;
  className?: string;
}

const toneToVariantMap: Record<DsStatusTone, DsBadgeVariant> = {
  neutral: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

export const DsStatusBadge: React.FC<DsStatusBadgeProps> = ({
  label,
  tone = 'neutral',
  className,
}) => {
  return <DsBadge label={label} variant={toneToVariantMap[tone]} className={className} />;
};
