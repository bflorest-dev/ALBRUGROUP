import React from 'react';
import type { HRDashboardData } from '../types';
import { getHRDashboardData } from '../services';
import { StatCard } from '@molecules/StatCard';
import { StatusBadge } from '@atoms/Badge/StatusBadge';
import './HRDashboard.css';

const HRDashboard: React.FC = () => {
  const [data, setData] = React.useState<HRDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    getHRDashboardData()
      .then((res) => {
        if (mounted) setData(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="hr-dashboard">
        <div className="hr-stats-row">
          <div className="stat-placeholder" />
          <div className="stat-placeholder" />
          <div className="stat-placeholder" />
        </div>
        <div className="hr-sections">
          <div className="hr-section card-placeholder" />
          <div className="hr-section card-placeholder" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="hr-dashboard">No data</div>;

  return (
    <div className="hr-dashboard">
      <div className="hr-stats-row">
        <StatCard stat={{ label: 'EMPLEADOS', value: data.totalEmployees }} />
        <StatCard stat={{ label: 'NUEVAS ALTAS', value: data.newHires.length }} />
        <StatCard stat={{ label: 'REVISIONES PEND.', value: data.pendingReviews.length }} />
      </div>

      <div className="hr-sections">
        <section className="hr-section">
          <div className="section-header">
            <h3>Nuevas Altas</h3>
          </div>
          <ul className="hr-list">
            {data.newHires.map((e) => (
              <li key={e.id} className="hr-list-item">
                <div className="hr-item-name">{e.name}</div>
                <div className="hr-item-meta">{e.position} • {e.department}</div>
                <div className="hr-item-right">{new Date(e.hireDate).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="hr-section">
          <div className="section-header">
            <h3>Revisiones pendientes</h3>
          </div>
          <ul className="hr-list">
            {data.pendingReviews.map((r) => (
              <li key={r.id} className="hr-list-item">
                <div className="hr-item-name">{r.type}</div>
                <div className="hr-item-meta">Empleado ID: {r.employeeId}</div>
                <div className="hr-item-right"><StatusBadge status={r.type} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default HRDashboard;