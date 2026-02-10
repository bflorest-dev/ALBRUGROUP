/**
 * Componente StatusBadge - Insignia de estado
 */

import type { EmployeeStatus } from '../../../types';
import { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_BG_COLORS } from '../../../utils/constants';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: EmployeeStatus;
  onClick?: () => void;
  clickable?: boolean;
}

export const StatusBadge = ({ status, onClick, clickable }: StatusBadgeProps) => {
  const color = EMPLOYEE_STATUS_COLORS[status];
  const bgColor = EMPLOYEE_STATUS_BG_COLORS[status];

  return (
    <span
      className={`status-badge ${clickable ? 'clickable' : ''}`}
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
