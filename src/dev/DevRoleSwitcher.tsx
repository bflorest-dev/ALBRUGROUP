import React from 'react';
import type { Role } from '../shared/types';

interface DevRoleSwitcherProps {
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
}

const roles: Role[] = [
  'ADMINISTRADOR',
  'DESARROLLADOR',
  'RRHH',
  'RECLUTAMIENTO',
  'CAPACITACION',
  'CONTABILIDAD',
  'COMMUNITY',
  'SUPERVISOR_VENTAS',
  'ASESOR_VENTAS',
  'SUPERVISOR_BACKOFFICE',
  'ASESOR_BACKOFFICE',
  'SUPERVISOR_GTR',
  'ASESOR_GTR',
  'SUPERVISOR_POSTVENTA',
  'ASESOR_POSTVENTA',
];

const DevRoleSwitcher: React.FC<DevRoleSwitcherProps> = ({ selectedRole, onRoleChange }) => {
  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000, background: 'white', padding: '10px', border: '1px solid black' }}>
      <label htmlFor="role-select">Dev Role Switcher:</label>
      <select
        id="role-select"
        value={selectedRole}
        onChange={(e) => onRoleChange(e.target.value as Role)}
      >
        {roles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );
};

export default DevRoleSwitcher;