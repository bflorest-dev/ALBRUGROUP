import { describe, expect, it } from 'vitest';
import { esEquipoOperativo } from './equipos-operativos';

describe('equipos operativos', () => {
  it('incluye ClaroTeam2 en los filtros compartidos de métricas', () => {
    expect(esEquipoOperativo('ClaroTeam2')).toBe(true);
  });

  it('mantiene fuera equipos que no pertenecen al catálogo operativo', () => {
    expect(esEquipoOperativo('OtroEquipo')).toBe(false);
  });
});
