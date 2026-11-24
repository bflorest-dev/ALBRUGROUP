import { describe, expect, it } from 'vitest';
import { EventoResponse } from '../../../shared/models/preventa/preventa.models';
import { extractTipificationAdvisorNames } from './gtr-tipification-preview';

function event(overrides: Partial<EventoResponse>): EventoResponse {
  return {
    id: 1,
    idLead: 42,
    accion: 'TIPIFICACION',
    createdAt: '2026-11-24T10:00:00-05:00',
    ...overrides
  };
}

describe('extractTipificationAdvisorNames', () => {
  it('deduplicates by actor and keeps the latest responsible first', () => {
    const names = extractTipificationAdvisorNames([
      event({ id: 2, idActor: 10, nombreActor: '  Ana   Torres ', createdAt: '2026-11-24T10:30:00-05:00' }),
      event({ id: 1, idActor: 10, nombreActor: 'Ana Torres', createdAt: '2026-11-24T09:30:00-05:00' }),
      event({ id: 3, idActor: 11, nombreActor: 'Bruno Diaz', createdAt: '2026-11-24T10:15:00-05:00' })
    ]);

    expect(names).toEqual(['Ana Torres', 'Bruno Diaz']);
  });

  it('uses the normalized name as fallback and ignores incomplete or other events', () => {
    const names = extractTipificationAdvisorNames([
      event({ id: 4, idActor: null, nombreActor: '  Carla   Ruiz  ', createdAt: '2026-11-24T10:30:00-05:00' }),
      event({ id: 5, idActor: null, nombreActor: 'Carla Ruiz', createdAt: '2026-11-24T10:20:00-05:00' }),
      event({ id: 6, idActor: 12, nombreActor: '', nombreAsesorAsignado: 'Diego Perez', createdAt: '2026-11-24T10:15:00-05:00' }),
      event({ id: 7, idActor: 13, nombreActor: null }),
      event({ id: 8, idActor: 14, nombreActor: 'No debe aparecer', accion: 'ASIGNACION' })
    ]);

    expect(names).toEqual(['Carla Ruiz', 'Diego Perez']);
  });
});
