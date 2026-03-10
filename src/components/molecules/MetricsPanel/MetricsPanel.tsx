import React from 'react';
import './MetricsPanel.css';

interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
}

interface MetricsPanelProps {
  title: string;
  metrics: MetricItem[];
  color?: string;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ title, metrics, color = '#3B82F6' }) => {
  return (
    <div className="metrics-panel" style={{ '--panel-color': color } as React.CSSProperties}>
      <h3>{title}</h3>
      <div className="metrics-list">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-item">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">
              {metric.value}
              {metric.unit && <span className="metric-unit">{metric.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
