import { describe, expect, it } from 'vitest';
import { resolveSalesAdvisorAvailability } from './asesor-ventas-workspace.facade';

describe('resolveSalesAdvisorAvailability', () => {
  it.each([
    [0, 'DISPONIBLE'],
    [1, 'CON_LEADS'],
    [2, 'CON_LEADS'],
    [3, 'SIN_GESTIONAR'],
    [9, 'SIN_GESTIONAR'],
    [10, 'SATURADO']
  ] as const)('calcula %s leads como %s', (totalLeads, expected) => {
    expect(resolveSalesAdvisorAvailability('ONLINE', totalLeads, false)).toBe(expected);
  });

  it('prioriza la gestion activa mientras la bandeja no este saturada', () => {
    expect(resolveSalesAdvisorAvailability('ONLINE', 3, true)).toBe('GESTIONANDO');
  });

  it('prioriza la saturacion incluso con un lead abierto', () => {
    expect(resolveSalesAdvisorAvailability('ONLINE', 10, true)).toBe('SATURADO');
  });

  it.each(['ALMUERZO', 'SERVICIOS', 'CAPACITACION'] as const)('prioriza %s como ocupado', (status) => {
    expect(resolveSalesAdvisorAvailability(status, 0, false)).toBe('OCUPADO');
  });

  it('no publica disponibilidad cuando el asesor esta offline', () => {
    expect(resolveSalesAdvisorAvailability('OFFLINE', 4, false)).toBeNull();
  });
});
