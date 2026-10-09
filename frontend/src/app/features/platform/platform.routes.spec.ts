import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { PLATFORM_ROUTES } from './platform.routes';

describe('rutas ADMIN de plataformas', () => {
  it('mantiene las tres vistas GTR con equipo y sin el nivel intermedio GTR', () => {
    const adminTeamRoutes = PLATFORM_ROUTES.filter((route) => route.path?.startsWith('admin/plataformas/equipos/'));

    expect(adminTeamRoutes.map((route) => route.path)).toEqual([
      'admin/plataformas/equipos/:idEquipo/plataforma',
      'admin/plataformas/equipos/:idEquipo/agendados',
      'admin/plataformas/equipos/:idEquipo/historicos'
    ]);
    expect(adminTeamRoutes.every((route) => route.data?.['section'])).toBe(true);
  });

  it('autoriza ADMINISTRADOR en las rutas globales de Backoffice', () => {
    const backofficeRoutes = PLATFORM_ROUTES.filter((route) => route.path?.startsWith('backoffice/'))
      .filter((route) => route.path !== 'backoffice/dashboard');

    expect(backofficeRoutes.map((route) => route.path)).toEqual([
      'backoffice/plataforma',
      'backoffice/general',
      'backoffice/gestion',
      'backoffice/programados',
      'backoffice/subsanables',
      'backoffice/rechazados',
      'backoffice/instalados'
    ]);
    expect(
      backofficeRoutes
        .filter((route) => route.data?.['roles'])
        .every((route) => (route.data?.['roles'] as string[]).includes('ADMINISTRADOR'))
    ).toBe(true);
  });

  it('retira las rutas ADMIN antiguas por equipo', () => {
    expect(PLATFORM_ROUTES.some((route) => route.path?.includes('admin/plataformas/equipos/:idEquipo/gtr'))).toBe(false);
    expect(PLATFORM_ROUTES.some((route) => route.path?.includes('admin/plataformas/equipos/:idEquipo/backoffice'))).toBe(false);
  });
});
