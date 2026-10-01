import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { canEditVigenteContract, scopeCapabilitiesForRoles } from './employee-workspace-drawer.component';

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

  it('permite editar el contrato vigente únicamente al administrador', () => {
    expect(canEditVigenteContract(['ADMINISTRADOR'], true)).toBe(true);
    expect(canEditVigenteContract(['RRHH'], true)).toBe(false);
    expect(canEditVigenteContract(['ADMINISTRADOR'], false)).toBe(false);
  });
});
