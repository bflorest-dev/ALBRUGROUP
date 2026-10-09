import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { buildAdminPlatformsNavigation } from './private-layout.component';

describe('navegación ADMIN de plataformas', () => {
  it('organiza equipos, backoffice y postventa como accesos hermanos', () => {
    const navigation = buildAdminPlatformsNavigation([
      { id: 2, nombre: 'ClaroTeam' },
      { id: 1, nombre: 'WinTeam' }
    ]);

    expect(navigation.map((item) => item.label)).toEqual(['Equipos', 'Backoffice', 'Postventa']);
    expect(navigation[0].children?.map((item) => item.label)).toEqual(['ClaroTeam', 'WinTeam']);
    expect(navigation[1].children).toHaveLength(6);
    expect(navigation[2].route).toBe('/app/admin/plataformas/postventa');
  });

  it('muestra las opciones GTR directamente dentro de cada equipo', () => {
    const [equipos] = buildAdminPlatformsNavigation([{ id: 7, nombre: 'FUERZA "A"' }]);
    const [equipo] = equipos.children ?? [];

    expect(equipo.children?.map((item) => item.label)).toEqual(['Plataforma', 'Agendados', 'Historicos']);
    expect(equipo.children?.map((item) => item.route)).toEqual([
      '/app/admin/plataformas/equipos/7/plataforma',
      '/app/admin/plataformas/equipos/7/agendados',
      '/app/admin/plataformas/equipos/7/historicos'
    ]);
    expect(equipo.children?.some((item) => item.label === 'GTR')).toBe(false);
  });

  it('mantiene Backoffice global, sin una ruta vinculada a equipo', () => {
    const [, backoffice] = buildAdminPlatformsNavigation([]);

    expect(backoffice.children?.map((item) => item.route)).toEqual([
      '/app/backoffice/general',
      '/app/backoffice/plataforma',
      '/app/backoffice/programados',
      '/app/backoffice/subsanables',
      '/app/backoffice/rechazados',
      '/app/backoffice/instalados'
    ]);
    expect(backoffice.children?.every((item) => !item.route?.includes('idEquipo'))).toBe(true);
  });
});
