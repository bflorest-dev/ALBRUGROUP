/**
 * Componente StatCard - Tarjeta de estadística
 */

import type { Statistic } from '../../../types';
import './StatCard.css';

interface StatCardProps {
  stat: Statistic;
}

export const StatCard = ({ stat }: StatCardProps) => {
  return (
    <div 
      className="stat-card"
      style={stat.color ? { '--stat-color': stat.color } as React.CSSProperties : {}}
    >
      <div className="stat-content">
        <span className="stat-label">{stat.label}</span>
        <div className="stat-value-row">
          <span className="stat-value">{stat.value.toLocaleString()}</span>
          {stat.percentage !== undefined && (
            <span className="stat-percentage">
              {stat.percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
