import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { ReporteDiaResponse } from '../../../../shared/models/schedule/reporte-dia-response';
import { AttendanceMarksEditorComponent } from './attendance-marks-editor.component';

describe('AttendanceMarksEditorComponent', () => {
  let fixture: ComponentFixture<AttendanceMarksEditorComponent>;

  const reporteJornadaAbierta = {
    idEmpleado: 21,
    fecha: '2026-09-03',
    marcaciones: [{
      tipoRegistro: 'PRINCIPAL',
      idRegistro: 10,
      origen: 'BASE',
      tipoTramo: 'BASE',
      esBase: true,
      motivo: null,
      entradaProgramada: '2026-09-03T07:00:00',
      salidaProgramada: '2026-09-03T16:00:00',
      entradaReal: '2026-09-03T06:53:00',
      salidaReal: null,
      abierta: true,
      salidaForzada: false
    }],
    tieneHorario: true,
    jornadaCerrada: false,
    tramos: [],
    sesiones: [],
    tiemposMuertos: [],
    presencia: [],
    excesos: [],
    inicioAlmuerzoProgramado: null,
    finAlmuerzoProgramado: null,
    almuerzoRealInicio: null,
    almuerzoRealFin: null,
    minutosAlmuerzoTomados: 0,
    minutosObjetivoDia: 540,
    minutosTrabajados: 0,
    minutosBalance: 0,
    minutosExtra: 0,
    minutosCompensados: 0
  } satisfies ReporteDiaResponse;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceMarksEditorComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AttendanceMarksEditorComponent);
    fixture.componentRef.setInput('reporte', reporteJornadaAbierta);
    fixture.componentRef.setInput('saving', false);
    fixture.componentRef.setInput('externalError', '');
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('permite completar la salida de una jornada abierta y la envía al guardar', () => {
    const emitted = vi.fn();
    fixture.componentInstance.guardar.subscribe(emitted);

    const root = fixture.nativeElement as HTMLElement;
    const salida = root.querySelector<HTMLInputElement>('input[aria-label="Salida de Marcación principal"]');
    expect(salida?.disabled).toBe(false);

    if (!salida) throw new Error('No se encontró el campo de salida');
    salida.value = '17:00';
    salida.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    root.querySelector<HTMLButtonElement>('.marks-editor__save')?.click();

    expect(emitted).toHaveBeenCalledWith({
      marcaciones: [{
        tipoRegistro: 'PRINCIPAL',
        idRegistro: 10,
        entrada: '2026-09-03T06:53:00',
        salida: '2026-09-03T17:00:00'
      }]
    });
  });

  it('muestra el formulario de creación y emite una marcación real con almuerzo', () => {
    const emitted = vi.fn();
    fixture.componentInstance.crear.subscribe(emitted);
    fixture.componentRef.setInput('reporte', {
      ...reporteJornadaAbierta,
      marcaciones: [],
      tramos: [{
        idAjuste: null,
        tipo: 'BASE',
        inicio: '2026-09-03T08:00:00',
        fin: '2026-09-03T17:00:00',
        estado: 'CUMPLIDO',
        ingresoReal: null,
        salidaReal: null,
        minutosAcreditados: null
      }],
      inicioAlmuerzoProgramado: '2026-09-03T13:00:00',
      finAlmuerzoProgramado: '2026-09-03T14:00:00'
    });
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Agregar marcación real');
    const form = root.querySelector('form');
    expect(form).not.toBeNull();
    const lunchStart = root.querySelector<HTMLInputElement>('#creation-almuerzo-inicio');
    const lunchEnd = root.querySelector<HTMLInputElement>('#creation-almuerzo-fin');
    if (!lunchStart || !lunchEnd) throw new Error('No se encontraron los campos de almuerzo');
    lunchStart.value = '2026-09-03T13:00';
    lunchStart.dispatchEvent(new Event('input', { bubbles: true }));
    lunchEnd.value = '2026-09-03T14:00';
    lunchEnd.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    form?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();

    expect(emitted).toHaveBeenCalledWith({
      entrada: '2026-09-03T08:00:00',
      salida: '2026-09-03T17:00:00',
      almuerzoInicio: '2026-09-03T13:00:00',
      almuerzoFin: '2026-09-03T14:00:00'
    });
  });
});
