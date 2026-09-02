import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetalleDiaResponse } from '../../shared/models/schedule/detalle-dia-response';
import { AttendanceService } from '../services/attendance.service';
import { PresenceService } from '../services/presence.service';
import { SessionService } from '../services/session.service';
import { AttendanceFacade } from './attendance.facade';

describe('AttendanceFacade schedule automation', () => {
  let facade: AttendanceFacade;

  const detail = (overrides: Partial<DetalleDiaResponse>): DetalleDiaResponse => ({
    idEmpleado: 21,
    fecha: '2026-06-15',
    idHorario: 7,
    estadoActual: 'OFFLINE',
    tieneHorario: true,
    jornadaCerrada: false,
    fechaHoraIngreso: null,
    fechaHoraSalida: null,
    tramos: [
      {
        idAjuste: null,
        tipo: 'BASE',
        inicio: '2026-06-15T17:00:00',
        fin: '2026-06-15T19:00:00',
        estado: 'PENDIENTE',
        ingresoReal: null,
        salidaReal: null,
        minutosAcreditados: 0
      }
    ],
    politica: {
      margenAdelantoMin: 5,
      bloqueoTardanzaMin: 20,
      maxMinutosPausaActiva: 5,
      maxUsosPausaActivaDia: 1,
      ventanaMarcaAlmuerzoMin: 15,
      permiteIngresoDuranteTurno: false
    },
    version: 'v1',
    minutosObjetivoDia: 120,
    minutosTrabajados: 0,
    minutosBalance: -120,
    minutosExtra: 0,
    minutosCompensados: 0,
    inicioAlmuerzoProgramado: null,
    minutosAlmuerzoProgramado: null,
    almuerzoEstadoDesde: null,
    almuerzoRealInicio: null,
    almuerzoRealFin: null,
    origenAlmuerzo: null,
    minutosAlmuerzoTomados: 0,
    minutosServiciosHoy: 0,
    minutosPausaActivaHoy: 0,
    minutosCapacitacionHoy: 0,
    pausaActivaUsosHoy: 0,
    sesionEnCurso: false,
    minutosServiciosTope: 20,
    maxMinutosPausaActiva: 5,
    sesionActualTipo: null,
    sesionActualInicio: null,
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
            registrarIngreso: vi.fn(() => of(detail({ estadoActual: 'ONLINE' }))),
            registrarSalida: vi.fn(() => of(detail({ jornadaCerrada: true }))),
            iniciarAlmuerzo: vi.fn(),
            finalizarAlmuerzo: vi.fn(),
            notificarBandejaVacia: vi.fn(),
            iniciarServicios: vi.fn(),
            finalizarServicios: vi.fn(),
            iniciarPausaActiva: vi.fn(),
            finalizarPausaActiva: vi.fn(),
            finalizarCapacitacion: vi.fn()
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

    facade['evaluateAttendanceAutomation'](detail({}));
    vi.advanceTimersByTime(60_000);
    expect(reload).toHaveBeenCalledOnce();

    vi.setSystemTime(new Date(2026, 5, 15, 17, 0));
    facade['evaluateAttendanceAutomation'](detail({}));
    expect(submit).toHaveBeenCalledWith('REGISTRAR_INGRESO');
  });

  it('mantiene el ingreso manual cuando el usuario llega despues del inicio', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 17, 2));
    const submit = vi.spyOn(facade, 'submitAction');

    facade['evaluateAttendanceAutomation'](detail({}));

    expect(submit).not.toHaveBeenCalled();
  });
});
