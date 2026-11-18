import {
  homeRouteForRole,
  operationalScopeForRole,
  resolveDefaultActiveRole,
  UNASSIGNED_ROLE_HOME_ROUTE
} from './role.constants';

describe('role.constants', () => {
  it('prioriza Postventa como modo inicial cuando el usuario tambien tiene Backoffice', () => {
    expect(resolveDefaultActiveRole(['ASESOR_BACKOFFICE', 'ASESOR_POSTVENTA'])).toBe('ASESOR_POSTVENTA');
  });

  it('resuelve el ambito operacional de los roles por proveedor', () => {
    expect(operationalScopeForRole('ASESOR_BACKOFFICE')).toBe('BACKOFFICE');
    expect(operationalScopeForRole('ASESOR_POSTVENTA')).toBe('POSTVENTA');
    expect(operationalScopeForRole('ADMINISTRADOR')).toBeNull();
  });

  it('envia a un espacio seguro a usuarios sin rol o con rol aun no implementado', () => {
    expect(homeRouteForRole(null)).toBe(UNASSIGNED_ROLE_HOME_ROUTE);
    expect(homeRouteForRole('CONTADOR')).toBe(UNASSIGNED_ROLE_HOME_ROUTE);
    expect(homeRouteForRole('ADMINISTRADOR')).toBe('/app/admin/dashboard');
  });
});
