import React from 'react';
import type { Role } from '@shared/types';

// TODO: Importar desde src/caracteristicas/ despuÃ©s de migraciÃ³n completa
// Temporalmente devolvemos placeholders para cada role
// import { AdminDashboard } from '../caractÃ©risticas/admin/pages';
// import { DeveloperDashboard } from '../caracteristicas/desarrollador/pages';
// etc.

interface RouterByRoleProps {
  role: Role;
}

const RouterByRole: React.FC<RouterByRoleProps> = ({ role }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Dashboard para {role}</h1>
      <p>Funcionalidad en desarrollo - MigraciÃ³n FSD en progreso</p>
    </div>
  );
};

export default RouterByRole;

