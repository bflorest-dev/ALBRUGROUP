import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttendanceActionOption } from '../../models/schedule/estado-asistencia';
import { AttendanceStatusPickerComponent } from './attendance-status-picker.component';

describe('AttendanceStatusPickerComponent guidance', () => {
  let fixture: ComponentFixture<AttendanceStatusPickerComponent>;
  let component: AttendanceStatusPickerComponent;

  const actions: AttendanceActionOption[] = [
    {
      key: 'registrar-salida',
      actionId: 'REGISTRAR_SALIDA',
      targetStatus: 'OFFLINE',
      label: 'OFFLINE',
      enabled: true
    }
  ];

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [AttendanceStatusPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(AttendanceStatusPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('statusLabel', 'ONLINE');
    fixture.componentRef.setInput('statusColor', '#37c676');
    fixture.componentRef.setInput('actions', actions);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('errorMessage', '');
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('abre el menu y enfoca OFFLINE al activar la guia', () => {
    fixture.componentRef.setInput('guidedActionId', 'REGISTRAR_SALIDA');
    fixture.detectChanges();
    vi.runAllTimers();

    const guided = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-guided-action="true"]'
    );
    expect(guided?.textContent).toContain('OFFLINE');
    expect(document.activeElement).toBe(guided);
  });

  it('reabre OFFLINE cuando falla la accion y cierra la guia solo al cancelarla', () => {
    fixture.componentRef.setInput('guidedActionId', 'REGISTRAR_SALIDA');
    fixture.detectChanges();
    component['isOpen'].set(false);

    fixture.componentRef.setInput('errorMessage', 'No fue posible registrar la salida.');
    fixture.detectChanges();
    vi.runAllTimers();
    expect(fixture.nativeElement.querySelector('[data-guided-action="true"]')).not.toBeNull();

    fixture.componentRef.setInput('guidedActionId', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.attendance-status__menu')).toBeNull();
  });
});
