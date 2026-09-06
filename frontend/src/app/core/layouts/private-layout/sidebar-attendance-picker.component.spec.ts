import { TestBed } from '@angular/core/testing';
import { AttendanceActionOption } from '../../../shared/models/schedule/estado-asistencia';
import { SidebarAttendancePickerComponent } from './sidebar-attendance-picker.component';

describe('SidebarAttendancePickerComponent', () => {
  const actions: AttendanceActionOption[] = [
    {
      key: 'lunch',
      actionId: 'INICIAR_ALMUERZO',
      targetStatus: 'ALMUERZO',
      label: 'Iniciar almuerzo',
      enabled: true
    },
    {
      key: 'offline',
      actionId: 'REGISTRAR_SALIDA',
      targetStatus: 'OFFLINE',
      label: 'Marcar salida',
      enabled: true
    },
    {
      key: 'locked',
      actionId: 'INICIAR_PAUSA_ACTIVA',
      targetStatus: 'PAUSA_ACTIVA',
      label: 'Pausa activa',
      enabled: false,
      disabledReason: 'Disponible más tarde'
    }
  ];

  const createFixture = () => {
    TestBed.configureTestingModule({ imports: [SidebarAttendancePickerComponent] });
    const fixture = TestBed.createComponent(SidebarAttendancePickerComponent);
    fixture.componentRef.setInput('statusLabel', 'ONLINE');
    fixture.componentRef.setInput('statusColor', '#37c676');
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();
    return fixture;
  };

  it('abre el menú hacia arriba y ejecuta una acción directa', () => {
    const fixture = createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.actionSelected.subscribe((action) => emitted.push(action));

    (fixture.nativeElement.querySelector('.sidebar-attendance__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-attendance__menu')).toBeTruthy();
    const options = fixture.nativeElement.querySelectorAll('.sidebar-attendance__option') as NodeListOf<HTMLButtonElement>;
    options[0].click();
    fixture.detectChanges();

    expect(emitted).toEqual(['INICIAR_ALMUERZO']);
    expect(fixture.nativeElement.querySelector('.sidebar-attendance__menu')).toBeNull();
  });

  it('pide confirmación antes de registrar la salida', () => {
    const fixture = createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.actionSelected.subscribe((action) => emitted.push(action));

    fixture.componentInstance.open();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.sidebar-attendance__option') as NodeListOf<HTMLButtonElement>;
    options[1].click();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
    expect(fixture.componentInstance['pendingConfirmation']()).toEqual(actions[1]);
    expect(fixture.nativeElement.querySelector('.sidebar-attendance__confirm-stage')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.sidebar-attendance__options')).toBeNull();

    fixture.componentInstance['confirmPendingAction']();
    expect(emitted).toEqual(['REGISTRAR_SALIDA']);
  });

  it('cancela la confirmación con Escape sin cerrar el selector', () => {
    const fixture = createFixture();
    fixture.componentInstance.open();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-action-key="offline"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance['pendingConfirmation']()).toBeNull();
    expect(fixture.nativeElement.querySelector('.sidebar-attendance__menu')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.sidebar-attendance__confirm-stage')).toBeNull();
  });

  it('muestra el cronómetro activo y conserva bloqueadas las acciones no disponibles', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('timerText', '04:13');
    fixture.detectChanges();

    const timer = fixture.nativeElement.querySelector('.sidebar-attendance__timer') as HTMLElement;
    expect(timer.textContent).toContain('04:13');
    expect(timer.querySelector('.ti-clock')).toBeTruthy();

    fixture.componentInstance.open();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.sidebar-attendance__option') as NodeListOf<HTMLButtonElement>;
    expect(options[2].disabled).toBe(true);
    expect(options[2].textContent).toContain('Disponible más tarde');
  });

  it('en modo guiado resalta OFFLINE y permite continuar trabajando', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('guidedActionId', 'REGISTRAR_SALIDA');
    const cancelled: boolean[] = [];
    fixture.componentInstance.guidanceCancelled.subscribe(() => cancelled.push(true));
    fixture.componentInstance.open();
    fixture.detectChanges();

    const guided = fixture.nativeElement.querySelector('.sidebar-attendance__option.is-guided') as HTMLButtonElement;
    expect(guided.textContent).toContain('Marcar salida');
    (fixture.nativeElement.querySelector('.sidebar-attendance__guidance button') as HTMLButtonElement).click();
    expect(cancelled).toEqual([true]);
  });

  it('oculta la guía mientras confirma OFFLINE y la recupera al cancelar', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('guidedActionId', 'REGISTRAR_SALIDA');
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-attendance__guidance')).toBeTruthy();
    (fixture.nativeElement.querySelector('[data-action-key="offline"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-attendance__guidance')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sidebar-attendance__confirm-stage')).toBeTruthy();

    (fixture.nativeElement.querySelector('.sidebar-attendance__confirm-cancel') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-attendance__confirm-stage')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sidebar-attendance__guidance')).toBeTruthy();
  });
});
