import React from 'react';
import type { Role } from './shared/types';
import { AdminDashboard } from './features/ADMINISTRADOR/components';
import { DeveloperDashboard } from './features/DESARROLLADOR/components';
import { LoginPage } from './features/LOGIN/components';
import { EmployeeDashboard } from './features/RRHH/pages/EmployeeDashboard';
import { ApplicantsDashboard } from './features/RRHH/pages/ApplicantsDashboard';

interface RouterByRoleProps {
  role: Role;
}

const RouterByRole: React.FC<RouterByRoleProps> = ({ role }) => {
  switch (role) {
    case 'ADMINISTRADOR':
      return <AdminDashboard />;
    case 'DESARROLLADOR':
      return <DeveloperDashboard />;
    case 'LOGIN':
      return <LoginPage />;
    case 'RRHH':
      return <EmployeeDashboard />;
    case 'RECLUTAMIENTO':
      return <ApplicantsDashboard />;
    default:
      return <div>Dashboard for {role} - Coming Soon</div>;
  }
};

export default RouterByRole;