import { describe, expect, it } from 'vitest';
import { ROLE_HOME_ROUTES } from '../../constants/role.constants';
import { sidebarDomainsForRole } from './sidebar-v2.config';

describe('sidebar V2 role configuration', () => {
  it.each(Object.keys(ROLE_HOME_ROUTES))(
    'habilita la navegación V2 para %s',
    (role) => {
      expect(sidebarDomainsForRole(role).length).toBeGreaterThan(0);
    }
  );

  it.each(Object.keys(ROLE_HOME_ROUTES))('mantiene identificadores de dominio únicos para %s', (role) => {
    const ids = sidebarDomainsForRole(role).map((domain) => domain.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mantiene navegación V2 para roles desconocidos', () => {
    expect(sidebarDomainsForRole('ROL_NO_CONFIGURADO')).toEqual([
      expect.objectContaining({ id: 'workspace' })
    ]);
  });

  it('trata MONITOR con el mismo sidebar de backoffice', () => {
    expect(sidebarDomainsForRole('MONITOR')).toEqual(sidebarDomainsForRole('ASESOR_BACKOFFICE'));
  });
});
