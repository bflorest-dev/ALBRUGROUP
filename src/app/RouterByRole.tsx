import React from 'react';
import type { Role } from '@compartido/tipos';

// TODO: Importar desde src/caracteristicas/ después de migración completa
// Temporalmente devolvemos placeholders para cada role
// import { AdminDashboard } from '../caractéristicas/admin/pages';
// import { DeveloperDashboard } from '../caracteristicas/desarrollador/pages';
// etc.

interface RouterByRoleProps {
  role: Role;
}

const RouterByRole: React.FC<RouterByRoleProps> = ({ role }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Dashboard para {role}</h1>
      <p>Funcionalidad en desarrollo - Migración FSD en progreso</p>
    </div>
  );
};

export default RouterByRole;
