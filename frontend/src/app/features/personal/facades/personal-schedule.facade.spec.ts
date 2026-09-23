import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { AdminRrhhService } from '../../admin/services/admin-rrhh.service';
import { ContratoResponse } from '../../../shared/models/rrhh/contrato-response';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';
import { PersonalScheduleFacade } from './personal-schedule.facade';

function schedule(id: number, fechaInicio: string, fechaFin: string | null = null): HorarioResponse {
  return {
    id,
    idEmpleado: 10,
    idContrato: 20,
    modalidad: 'FULL_TIME',
    horasObjetivoSemanal: 48,
    horasObjetivoMensual: 192,
    minutosAlmuerzo: 60,
    minutosServicios: 0,
    fechaInicio,
    fechaFin,
    compensable: true,
    detalles: [
      { id: id * 10 + 1, dia: 'LUNES', horaEntrada: '09:00', horaSalida: '18:00', inicioAlmuerzo: '13:00', finAlmuerzo: '14:00', laborable: true },
      { id: id * 10 + 2, dia: 'DOMINGO', horaEntrada: '', horaSalida: '', inicioAlmuerzo: '', finAlmuerzo: '', laborable: false }
    ],
    excepciones: []
  };
}

const contract = { id: 20, modalidad: 'FULL_TIME' } as ContratoResponse;

describe('PersonalScheduleFacade', () => {
  it('clasifica y expone el historial del horario', async () => {
    const current = schedule(1, '2020-01-01');
    const previous = schedule(2, '2019-01-01', '2019-12-31');
    const future = schedule(3, '2999-01-01');
    const service = {
      listarHistoricoHorarios: vi.fn(() => of({ content: [current, previous, future] })),
      registrarHorario: vi.fn()
    };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        PersonalScheduleFacade,
        { provide: AdminRrhhService, useValue: service },
        { provide: OperationalGateService, useValue: { createGate: () => ({ canMutateOperationalData: () => true, blockedMessage: () => '' }) } }
      ]
    });

    const facade = TestBed.inject(PersonalScheduleFacade);
    facade.initialize(10, contract, current);
    await facade.loadHistory();

    expect(facade.historyItems().map((item) => item.label)).toEqual(['Actual', 'Anterior', 'Futuro']);
    expect(facade.historyItems()[0].range).toBe('09:00–18:00');
  });

  it('registra un horario nuevo cuando el empleado todavía no tiene uno', async () => {
    const created = schedule(5, '2026-09-24');
    const service = {
      listarHistoricoHorarios: vi.fn(() => of({ content: [] })),
      registrarHorario: vi.fn(() => of(created))
    };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        PersonalScheduleFacade,
        { provide: AdminRrhhService, useValue: service },
        { provide: OperationalGateService, useValue: { createGate: () => ({ canMutateOperationalData: () => true, blockedMessage: () => '' }) } }
      ]
    });

    const facade = TestBed.inject(PersonalScheduleFacade);
    facade.initialize(10, contract, null);
    expect(await facade.save()).toBe(true);
    expect(service.registrarHorario).toHaveBeenCalledTimes(1);
    expect(facade.schedule()?.id).toBe(5);
  });

  it('bloquea el guardado cuando el gate operativo no permite modificar', async () => {
    const service = { listarHistoricoHorarios: vi.fn(() => of({ content: [] })) };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        PersonalScheduleFacade,
        { provide: AdminRrhhService, useValue: service },
        { provide: OperationalGateService, useValue: { createGate: () => ({ canMutateOperationalData: () => false, blockedMessage: () => 'Marca ONLINE para continuar.' }) } }
      ]
    });

    const facade = TestBed.inject(PersonalScheduleFacade);
    facade.initialize(10, contract, null);

    expect(await facade.save()).toBe(false);
    expect(facade.error()).toBe('Marca ONLINE para continuar.');
  });
});
