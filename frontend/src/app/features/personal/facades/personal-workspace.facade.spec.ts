import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SessionService } from '../../../core/services/session.service';
import { AdminEquipoService } from '../../admin/services/admin-equipo.service';
import { AdminRrhhService } from '../../admin/services/admin-rrhh.service';
import { PersonalAccessService } from '../services/personal-access.service';
import {
  groupPersonalRowsByProvider,
  groupPersonalRowsByTeam,
  personalScopeTypeForRole,
  PersonalWorkspaceFacade,
  PersonalDirectoryRow,
  resolveProviderAssignments
} from './personal-workspace.facade';

function row(
  id: number,
  role: string,
  providerEntries: Array<[number, string]> = [],
  teamNames: string[] = []
): PersonalDirectoryRow {
  return {
    employee: { idEmpleado: id, nombres: `Empleado ${id}`, apellidos: 'Prueba' } as PersonalDirectoryRow['employee'],
    access: null,
    category: 'OPERATIVO',
    hasContract: true,
    primaryRole: role,
    secondaryRoles: [],
    teamNames,
    teamIds: [],
    providerIds: providerEntries.map(([providerId]) => providerId),
    providerNames: providerEntries.map(([, providerName]) => providerName)
  };
}

describe('matriz de scope de PERSONAL', () => {
  it('distingue roles por equipo, proveedor y sin scope', () => {
    expect(personalScopeTypeForRole('ASESOR_VENTAS')).toBe('TEAM');
    expect(personalScopeTypeForRole('ASESOR_BACKOFFICE')).toBe('PROVIDER');
    expect(personalScopeTypeForRole('ANALISTA_RRHH')).toBe('NONE');
  });

  it('mantiene la agrupacion existente por equipo', () => {
    const groups = groupPersonalRowsByTeam([
      row(1, 'ASESOR_VENTAS', [], ['ClaroTeam']),
      row(2, 'ASESOR_VENTAS', [], ['ClaroTeam', 'WinTeam']),
      row(3, 'ASESOR_VENTAS')
    ]);

    expect(groups.map((group) => group.label)).toEqual(['ClaroTeam', 'Varios equipos', 'Sin equipo']);
    expect(groups[1].employees.map((item) => item.employee.idEmpleado)).toEqual([2]);
  });

  it('agrupa proveedores sin crear proveedores vacios y duplica quien tiene varios', () => {
    const groups = groupPersonalRowsByProvider([
      row(1, 'ASESOR_BACKOFFICE', [[10, 'Claro'], [20, 'Win']]),
      row(2, 'ASESOR_BACKOFFICE'),
      row(3, 'ASESOR_BACKOFFICE', [[10, 'Claro']])
    ]);

    expect(groups.map((group) => group.label)).toEqual(['Claro', 'Win', 'Sin proveedor']);
    expect(groups.find((group) => group.label === 'Claro')?.employees.map((item) => item.employee.idEmpleado))
      .toEqual([1, 3]);
    expect(groups.find((group) => group.label === 'Win')?.employees.map((item) => item.employee.idEmpleado))
      .toEqual([1]);
  });

  it('conserva BACKOFFICE y POSTVENTA en mapas separados', () => {
    const providers = [{ id: 10, nombre: 'Claro' }, { id: 20, nombre: 'Win' }];
    const backoffice = resolveProviderAssignments(providers, [{ idEmpleado: 1, proveedorIds: [10] }]);
    const postventa = resolveProviderAssignments(providers, [{ idEmpleado: 1, proveedorIds: [20] }]);

    expect(backoffice[1].map((entry) => entry.name)).toEqual(['Claro']);
    expect(postventa[1].map((entry) => entry.name)).toEqual(['Win']);
  });

  it('expone error cuando falla la carga del scope por proveedor', async () => {
    const teamsService = {
      listarProveedores: () => throwError(() => new Error('endpoint no disponible')),
      listarAsignacionesProveedor: () => of([])
    };
    TestBed.configureTestingModule({
      providers: [
        PersonalWorkspaceFacade,
        { provide: AdminEquipoService, useValue: teamsService },
        { provide: AdminRrhhService, useValue: {} },
        { provide: PersonalAccessService, useValue: {} },
        { provide: SessionService, useValue: { getActiveRole: () => 'RRHH' } }
      ]
    });

    const facade = TestBed.inject(PersonalWorkspaceFacade);
    await (facade as unknown as { loadProviderScopes: () => Promise<void> }).loadProviderScopes();

    expect(facade.providerScopeStatus()).toBe('error');
    expect(facade.providerScopeError()).toContain('No se pudo cargar');
    expect(facade.providerAssignmentsByScope()).toEqual({ BACKOFFICE: {}, POSTVENTA: {} });
  });
});
