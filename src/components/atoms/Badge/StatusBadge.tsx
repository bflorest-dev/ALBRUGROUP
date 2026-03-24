/**
 * Componente StatusBadge - Insignia de estado
 */

import { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_BG_COLORS } from '@compartido/lib';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: string;
  onClick?: () => void;
  clickable?: boolean;
}

export const StatusBadge = ({ status, onClick, clickable }: StatusBadgeProps) => {
  const color = EMPLOYEE_STATUS_COLORS[status];
  const bgColor = EMPLOYEE_STATUS_BG_COLORS[status];

  return (
    <span
      className={`employee-status-badge ${clickable ? 'clickable' : ''}`}
      style={{
        backgroundColor: bgColor,
        color: color,
      }}
      onClick={onClick}
    >
      ● {status}
    </span>
  );
};
