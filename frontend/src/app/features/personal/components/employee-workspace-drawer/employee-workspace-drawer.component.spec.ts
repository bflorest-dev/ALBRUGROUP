import { describe, expect, it } from 'vitest';
import { scopeCapabilitiesForRoles } from './employee-workspace-drawer.component';

describe('capacidades de ámbito del drawer de PERSONAL', () => {
  it('muestra únicamente equipos para roles de equipo', () => {
    expect(scopeCapabilitiesForRoles(['ASESOR_VENTAS'])).toEqual({ team: true, provider: false });
  });

  it('muestra únicamente proveedores para roles gestionados por proveedor', () => {
    expect(scopeCapabilitiesForRoles(['ASESOR_BACKOFFICE', 'MONITOR'])).toEqual({ team: false, provider: true });
  });

  it('muestra ambos controles para roles mixtos y uno por cada scope', () => {
    expect(scopeCapabilitiesForRoles(['ASESOR_VENTAS', 'ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA']))
      .toEqual({ team: true, provider: true });
  });
});
