import { useState, useEffect } from 'react';
import type { Role } from '../../shared/types';

export const useFetchRoles = (): Role[] => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    // Mock - reemplazar con API real
    setRoles(['LOGIN']);
  }, []);

  return roles;
};
