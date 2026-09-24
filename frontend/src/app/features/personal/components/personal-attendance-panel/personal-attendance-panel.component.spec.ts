import { describe, expect, it } from 'vitest';
import { CumplimientoDetalleDiaResponse } from '../../../../shared/models/schedule/cumplimiento-response';
import { personalAttendanceBalanceLabel, personalAttendanceDayState } from './personal-attendance-panel.component';

const baseDay: CumplimientoDetalleDiaResponse = {
  fecha: '2026-09-10',
  laborable: true,
  horaEntradaEstablecida: '09:00:00',
  horaEntradaAsistencia: '09:00:00',
  horaSalidaEstablecida: '18:00:00',
  horaSalidaAsistencia: '18:00:00',
  salidaForzada: false,
  jornadaCerrada: true,
  minutosObjetivoDia: 540,
  minutosTrabajados: 540,
  minutosBalance: 0,
  minutosServiciosAcumulados: 0,
  excedioServicios: false,
  tardanza: false,
  inicioAlmuerzoProgramado: null,
  finAlmuerzoProgramado: null,
  almuerzoRealInicio: null,
  almuerzoRealFin: null,
  minutosExtra: 0,
  minutosCompensados: 0,
  tramos: []
};

describe('presentación de asistencia en PERSONAL', () => {
  it('clasifica los estados principales del registro diario', () => {
    expect(personalAttendanceDayState({ ...baseDay, laborable: false }, '2026-09-23')).toBe('libre');
    expect(personalAttendanceDayState({ ...baseDay, fecha: '2026-09-24', horaEntradaAsistencia: null }, '2026-09-23')).toBe('futuro');
    expect(personalAttendanceDayState({ ...baseDay, fecha: '2026-09-23', horaEntradaAsistencia: null }, '2026-09-23')).toBe('pendiente');
    expect(personalAttendanceDayState({ ...baseDay, horaEntradaAsistencia: null }, '2026-09-23')).toBe('falta');
    expect(personalAttendanceDayState({ ...baseDay, tardanza: true }, '2026-09-23')).toBe('tardanza');
  });

  it('mantiene el balance en cero o negativo y separa las duraciones positivas', () => {
    expect(personalAttendanceBalanceLabel(120)).toBe('0 h');
    expect(personalAttendanceBalanceLabel(-90)).toBe('−1 h 30 min');
  });
});
