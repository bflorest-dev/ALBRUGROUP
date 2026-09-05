import { describe, expect, it } from 'vitest';
import { shouldGuideAttendanceLogout } from './attendance-logout-guidance';

describe('shouldGuideAttendanceLogout', () => {
  it('guia a OFFLINE cuando el turno termino y el backend confirma ONLINE', () => {
    expect(
      shouldGuideAttendanceLogout({
        alwaysOnlineRole: false,
        statusConfirmed: true,
        status: 'ONLINE',
        shiftEnded: true
      })
    ).toBe(true);
  });

  it.each(['ALMUERZO', 'SERVICIOS', 'PAUSA_ACTIVA', 'CAPACITACION', 'OFFLINE'] as const)(
    'permite cerrar sesion directamente desde %s',
    (status) => {
      expect(
        shouldGuideAttendanceLogout({
          alwaysOnlineRole: false,
          statusConfirmed: true,
          status,
          shiftEnded: true
        })
      ).toBe(false);
    }
  );

  it('no inventa la guia sin estado confirmado ni horario finalizado', () => {
    expect(
      shouldGuideAttendanceLogout({
        alwaysOnlineRole: false,
        statusConfirmed: false,
        status: 'ONLINE',
        shiftEnded: true
      })
    ).toBe(false);
    expect(
      shouldGuideAttendanceLogout({
        alwaysOnlineRole: false,
        statusConfirmed: true,
        status: 'ONLINE',
        shiftEnded: false
      })
    ).toBe(false);
  });
});
