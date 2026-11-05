import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScheduleWeekEditorComponent } from './schedule-week-editor.component';

const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

function buildScheduleForm(): FormGroup {
  const formBuilder = new FormBuilder();
  return formBuilder.nonNullable.group({
    fechaInicio: ['2026-09-24'],
    compensable: ['true'],
    horaEntrada: ['09:00'],
    horaSalida: ['18:00'],
    inicioAlmuerzo: ['13:00'],
    finAlmuerzo: ['14:00'],
    modoAvanzado: ['true'],
    detalles: formBuilder.nonNullable.array(
      DAYS.map((dia) => formBuilder.nonNullable.group({
        dia: [dia],
        horaEntrada: ['09:00'],
        horaSalida: ['18:00'],
        inicioAlmuerzo: ['13:00'],
        finAlmuerzo: ['14:00'],
        laborable: [dia === 'DOMINGO' ? 'false' : 'true']
      }))
    )
  });
}

describe('ScheduleWeekEditorComponent', () => {
  let fixture: ComponentFixture<ScheduleWeekEditorComponent>;
  let component: ScheduleWeekEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScheduleWeekEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(ScheduleWeekEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('horarioForm', buildScheduleForm());
    fixture.detectChanges();
  });

  it('conserva los días no laborables existentes al agregar otro descanso', () => {
    const form = component.horarioForm!;
    const editor = component as unknown as {
      selectDay(index: number): void;
      toggleLaborable(checked: boolean): void;
    };

    editor.selectDay(0);
    editor.toggleLaborable(false);
    editor.selectDay(1);
    editor.toggleLaborable(false);

    expect(form.get('detalles.0.laborable')?.value).toBe('false');
    expect(form.get('detalles.1.laborable')?.value).toBe('false');
    expect(form.get('detalles.6.laborable')?.value).toBe('false');
  });
});
