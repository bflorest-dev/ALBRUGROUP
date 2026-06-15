import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetalleAsistenciaResponse } from '../../shared/models/schedule/detalle-asistencia-response';
import { AttendanceService } from '../services/attendance.service';
import { PresenceService } from '../services/presence.service';
import { SessionService } from '../services/session.service';
import { AttendanceFacade } from './attendance.facade';

describe('AttendanceFacade schedule automation', () => {
  let facade: AttendanceFacade;

  const detail = (overrides: Partial<DetalleAsistenciaResponse>): DetalleAsistenciaResponse => ({
    idEmpleado: 21,
    idHorario: 7,
    fecha: '2026-06-15',
    estadoActual: 'OFFLINE',
    entradaProgramada: '17:00:00',
    salidaProgramada: '19:00:00',
    inicioAlmuerzoProgramado: null,
    finAlmuerzoProgramado: null,
    fechaHoraIngreso: null,
    fechaHoraSalida: null,
    fechaHoraInicioAlmuerzo: null,
    fechaHoraFinAlmuerzo: null,
    minutosObjetivoDia: 120,
    minutosTrabajados: 0,
    minutosBalance: -120,
    minutosAlmuerzoTomados: 0,
    minutosServiciosPermitidos: 20,
    minutosServiciosAcumulados: 0,
    excedioServicios: false,
    jornadaCerrada: false,
    dentroHorario: false,
    operativo: false,
    ...overrides
  });

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        AttendanceFacade,
        {
          provide: AttendanceService,
          useValue: {
            getAsistenciaDia: vi.fn(() => of(detail({}))),
            registrarIngreso: vi.fn(() => of(detail({ estadoActual: 'ONLINE', operativo: true }))),
            registrarSalida: vi.fn(() => of(detail({ jornadaCerrada: true }))),
            iniciarAlmuerzo: vi.fn(),
            finalizarAlmuerzo: vi.fn(),
            iniciarServicios: vi.fn(),
            finalizarServicios: vi.fn()
          }
        },
        {
          provide: PresenceService,
          useValue: {
            start: vi.fn(async () => undefined),
            offline: vi.fn(async () => undefined),
            actualizarDisponibilidad: vi.fn(async () => undefined)
          }
        },
        {
          provide: SessionService,
          useValue: { getSession: vi.fn(() => null) }
        }
      ]
    });
    facade = TestBed.inject(AttendanceFacade);
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('espera sin limite y marca ingreso cuando inicia el siguiente tramo', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 16, 58));
    const reload = vi.spyOn(facade, 'reload');
    const submit = vi.spyOn(facade, 'submitAction');

    facade['evaluateAttendanceAutomation'](detail({ dentroHorario: false }));
    vi.advanceTimersByTime(60_000);
    expect(reload).toHaveBeenCalledOnce();

    vi.setSystemTime(new Date(2026, 5, 15, 17, 0));
    facade['evaluateAttendanceAutomation'](detail({ dentroHorario: true }));
    expect(submit).toHaveBeenCalledWith('REGISTRAR_INGRESO');
  });

  it('mantiene el ingreso manual cuando el usuario llega despues del inicio', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 17, 2));
    const submit = vi.spyOn(facade, 'submitAction');

    facade['evaluateAttendanceAutomation'](detail({ dentroHorario: true }));

    expect(submit).not.toHaveBeenCalled();
  });
});
