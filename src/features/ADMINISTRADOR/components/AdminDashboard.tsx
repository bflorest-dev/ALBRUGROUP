import React from 'react';
import type { AdminDashboardData } from '../types';
import { getAdminDashboardData } from '../services';
import RoleBadge from '../../../components/atoms/RoleBadge';

const AdminDashboard: React.FC = () => {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);

  React.useEffect(() => {
    getAdminDashboardData().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard <RoleBadge role="ADMINISTRADOR" /></h1>
      <p>Total Users: {data.totalUsers}</p>
      <p>System Health: {data.systemHealth}</p>
      <ul>
        {data.recentActivities.map(activity => (
          <li key={activity.id}>{activity.description}</li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;