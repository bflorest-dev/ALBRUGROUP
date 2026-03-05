import React from 'react';
import type { Role } from './shared/types';
import { AdminDashboard } from './features/ADMINISTRADOR/components';
import { DeveloperDashboard } from './features/DESARROLLADOR/components';
import { LoginPage } from './features/LOGIN/components';
import { EmployeeDashboard } from './features/RRHH/pages/EmployeeDashboard';
import { KanbanDashboard } from './features/RECLUTAMIENTO/pages/KanbanDashboard';
import { TrainingDashboard } from './features/CAPACITACION/pages/TrainingDashboard';
import { SalesAdvisorDashboard } from './features/ASESOR_VENTAS/pages';
import { CommunityDashboard } from './features/COMMUNITY/pages/CommunityDashboard';
import { GTRDashboard } from './features/SUPERVISOR_GTR/pages/GTRDashboard';

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
      return <KanbanDashboard />;
    case 'CAPACITACION':
      return <TrainingDashboard />;
    case 'ASESOR_VENTAS':
      return <SalesAdvisorDashboard />;
    case 'COMMUNITY':
      return <CommunityDashboard />;
    case 'SUPERVISOR_GTR':
    case 'ASESOR_GTR':
      return <GTRDashboard />;
    default:
      return <div>Dashboard for {role} - Coming Soon</div>;
  }
};

export default RouterByRole;