import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AttendanceService } from '../../../core/services/attendance.service';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { RrhhAsistenciaService } from '../../rrhh/asistencia/services/rrhh-asistencia.service';
import { CumplimientoDetalleDiaResponse } from '../../../shared/models/schedule/cumplimiento-response';
import { ReporteDiaResponse } from '../../../shared/models/schedule/reporte-dia-response';
import { PersonalAttendanceFacade } from './personal-attendance.facade';

function day(overrides: Partial<CumplimientoDetalleDiaResponse>): CumplimientoDetalleDiaResponse {
  return {
    fecha: '2026-09-01',
    laborable: true,
    horaEntradaEstablecida: '09:00:00',
    horaEntradaAsistencia: '09:10:00',
    horaSalidaEstablecida: '18:00:00',
    horaSalidaAsistencia: '17:00:00',
    salidaForzada: false,
    jornadaCerrada: true,
    minutosObjetivoDia: 540,
    minutosTrabajados: 450,
    minutosBalance: -90,
    minutosServiciosAcumulados: 0,
    excedioServicios: false,
    tardanza: true,
    inicioAlmuerzoProgramado: '13:00:00',
    finAlmuerzoProgramado: '14:00:00',
    almuerzoRealInicio: null,
    almuerzoRealFin: null,
    minutosExtra: 60,
    minutosCompensados: 0,
    tramos: [],
    ...overrides
  };
}

describe('PersonalAttendanceFacade', () => {
  function setup(reviewService: unknown, attendanceService: unknown, canDisplay = true) {
    TestBed.configureTestingModule({
      providers: [
        PersonalAttendanceFacade,
        { provide: RrhhAsistenciaService, useValue: reviewService },
        { provide: AttendanceService, useValue: attendanceService },
        {
          provide: OperationalGateService,
          useValue: { createGate: () => ({ canDisplayOperationalData: () => canDisplay, blockedMessage: () => 'Marca ONLINE para continuar.' }) }
        }
      ]
    });
    return TestBed.inject(PersonalAttendanceFacade);
  }

  it('carga el mes y deriva métricas sin convertir el balance en positivo', async () => {
    const reviewService = {
      getCumplimientoDetalle: vi.fn(() => of({
        empleados: [{ idEmpleado: 42, dias: [
          day({ fecha: '2026-09-01' }),
          day({ fecha: '2026-09-02', horaEntradaAsistencia: null, horaSalidaAsistencia: null, tardanza: false, minutosBalance: 0, minutosExtra: 0, minutosCompensados: 30 }),
          day({ fecha: '2026-09-03', laborable: false, horaEntradaAsistencia: null, horaSalidaAsistencia: null, minutosBalance: 0, minutosExtra: 0 })
        ] }]
      }))
    };
    const facade = setup(reviewService, { getReporteDia: vi.fn() });

    await facade.initialize(42);

    expect(facade.days()).toHaveLength(3);
    expect(facade.metrics()).toEqual({ presentes: 1, faltas: 1, tardanzas: 1, balance: -90, extra: 60, compensado: 30 });
  });

  it('expande un día, guarda el reporte y reutiliza el cache al abrirlo nuevamente', async () => {
    const report = { idEmpleado: 42, fecha: '2026-09-01' } as ReporteDiaResponse;
    const getReporteDia = vi.fn(() => of(report));
    const facade = setup(
      { getCumplimientoDetalle: vi.fn(() => of({ empleados: [{ idEmpleado: 42, dias: [day({})] }] })) },
      { getReporteDia }
    );

    await facade.initialize(42);
    await facade.toggleDay('2026-09-01');
    expect(facade.dayReport()).toBe(report);
    expect(getReporteDia).toHaveBeenCalledTimes(1);

    await facade.toggleDay('2026-09-01');
    await facade.toggleDay('2026-09-01');
    expect(facade.dayReport()).toBe(report);
    expect(getReporteDia).toHaveBeenCalledTimes(1);
  });

  it('expone el error del mes y permite reintentar', async () => {
    const getCumplimientoDetalle = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('fallo')))
      .mockReturnValueOnce(of({ empleados: [{ idEmpleado: 42, dias: [day({})] }] }));
    const facade = setup({ getCumplimientoDetalle }, { getReporteDia: vi.fn() });

    await facade.initialize(42);
    expect(facade.error()).toBe('fallo');

    await facade.retry();
    expect(facade.error()).toBe('');
    expect(facade.days()).toHaveLength(1);
  });
});
