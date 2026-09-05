import { describe, expect, it } from 'vitest';
import { ROLE_HOME_ROUTES } from '../../constants/role.constants';
import { sidebarDomainsForRole, sidebarV2EnabledForRole } from './sidebar-v2.config';

describe('sidebar V2 role configuration', () => {
  it.each(Object.keys(ROLE_HOME_ROUTES))(
    'habilita la navegación V2 para %s',
    (role) => {
      expect(sidebarV2EnabledForRole(role)).toBe(true);
      expect(sidebarDomainsForRole(role).length).toBeGreaterThan(0);
    }
  );

  it.each(Object.keys(ROLE_HOME_ROUTES))('mantiene identificadores de dominio únicos para %s', (role) => {
    const ids = sidebarDomainsForRole(role).map((domain) => domain.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mantiene el sidebar anterior como respaldo para roles desconocidos', () => {
    expect(sidebarV2EnabledForRole('ROL_NO_CONFIGURADO')).toBe(false);
    expect(sidebarDomainsForRole('ROL_NO_CONFIGURADO')).toEqual([]);
  });
});
