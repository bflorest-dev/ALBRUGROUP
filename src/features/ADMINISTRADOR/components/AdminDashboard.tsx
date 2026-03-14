import React from 'react';
import type { ErrorInfo } from 'react';
import type { AdminDashboardData } from '../types';
import { getAdminDashboardData } from '../services';
import RoleBadge from '../../../components/atoms/RoleBadge';
import { FeatureErrorBoundary } from '@components/utilities';
import { ErrorLogger } from '@services';
import './AdminDashboard.css';

const AdminDashboardContent: React.FC = () => {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);

  React.useEffect(() => {
    getAdminDashboardData().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard-wrapper">
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

const AdminDashboard: React.FC = () => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    ErrorLogger.logError('AdminDashboard', error, {
      componentStack: errorInfo.componentStack,
      feature: 'ADMINISTRADOR'
    });
  };

  return (
    <FeatureErrorBoundary 
      featureName="ADMINISTRADOR"
      onError={handleError}
    >
      <AdminDashboardContent />
    </FeatureErrorBoundary>
  );
};

export default AdminDashboard;