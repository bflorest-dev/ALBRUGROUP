import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ScheduleAdjustmentDialogComponent } from './schedule-adjustment-dialog.component';
import type { JornadaEfectivaResponse } from '../../models/schedule/jornada-efectiva-response';

describe('ScheduleAdjustmentDialogComponent', () => {
  let fixture: ComponentFixture<ScheduleAdjustmentDialogComponent>;
  let component: ScheduleAdjustmentDialogComponent;

  const jornada: JornadaEfectivaResponse = {
    idEmpleado: 21,
    idHorario: 7,
    fecha: '2026-06-15',
    laborableBase: true,
    tramos: [
      {
        idAjuste: null,
        inicio: '2026-06-15T09:00:00',
        fin: '2026-06-15T15:00:00',
        origen: null,
        base: true,
        motivo: 'Horario base'
      }
    ],
    tramoActual: null,
    proximoTramo: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleAdjustmentDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ScheduleAdjustmentDialogComponent);
    component = fixture.componentInstance;
  });

  it('precarga el tramo efectivo completo y emite el ajuste solicitado', () => {
    const emitted = vi.fn();
    component.saveRequested.subscribe(emitted);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('selectedDate', '2026-06-15');
    fixture.componentRef.setInput('jornada', jornada);
    fixture.detectChanges();

    const form = component['form'];
    expect(form.controls.inicio.value?.getHours()).toBe(9);
    expect(form.controls.fin.value?.getHours()).toBe(15);

    form.controls.motivo.setValue('Necesidad operativa');
    component['save']();

    expect(emitted).toHaveBeenCalledWith({
      inicio: '2026-06-15T09:00:00',
      fin: '2026-06-15T15:00:00',
      motivo: 'Necesidad operativa'
    });
  });

  it('mantiene el mensaje de error dentro del dialogo', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('selectedDate', '2026-06-15');
    fixture.componentRef.setInput('jornada', jornada);
    fixture.componentRef.setInput('error', 'No fue posible guardar el ajuste.');
    fixture.detectChanges();

    expect(document.body.textContent).toContain('No fue posible guardar el ajuste.');
  });
});
