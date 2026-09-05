import { describe, expect, it } from 'vitest';
import { sidebarDomainsForRole, sidebarV2EnabledForRole } from './sidebar-v2.config';

describe('sidebar V2 role configuration', () => {
  it.each(['ASESOR_GTR', 'SUPERVISOR_GTR', 'ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE'])(
    'habilita el piloto para %s',
    (role) => {
      expect(sidebarV2EnabledForRole(role)).toBe(true);
      expect(sidebarDomainsForRole(role)).toHaveLength(2);
    }
  );

  it('mantiene el sidebar anterior para los roles fuera del piloto', () => {
    expect(sidebarV2EnabledForRole('RRHH')).toBe(false);
    expect(sidebarDomainsForRole('RRHH')).toEqual([]);
  });
});
