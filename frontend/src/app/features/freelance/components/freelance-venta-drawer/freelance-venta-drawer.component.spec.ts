import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FreelanceService } from '../../services/freelance.service';
import { FreelanceVentaDrawerComponent } from './freelance-venta-drawer.component';

describe('FreelanceVentaDrawerComponent', () => {
  let fixture: ComponentFixture<FreelanceVentaDrawerComponent>;
  let component: FreelanceVentaDrawerComponent;

  const service = {
    opciones: vi.fn(() => of({ idEquipo: 7, proveedores: [], planes: [] })),
    listarDepartamentos: vi.fn(() => of([])),
    crear: vi.fn(),
    reenviar: vi.fn()
  };

  const response = {
    idOrigen: 9,
    requestId: 'request-1',
    idLead: 81,
    etapa: 'VENTA',
    numeroIntento: 1,
    registradoAt: '2026-09-30T10:00:00'
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    service.opciones.mockReturnValue(of({ idEquipo: 7, proveedores: [], planes: [] }));
    service.listarDepartamentos.mockReturnValue(of([]));
    service.crear.mockReturnValue(of(response));
    await TestBed.configureTestingModule({
      imports: [FreelanceVentaDrawerComponent],
      providers: [{ provide: FreelanceService, useValue: service }]
    }).compileComponents();
    fixture = TestBed.createComponent(FreelanceVentaDrawerComponent);
    component = fixture.componentInstance;
  });

  it('reinicia el formulario cada vez que se vuelve a abrir para crear una venta', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    component.form.patchValue({
      lead: '999888777',
      nombreTitularServicio: 'Cliente de prueba',
      correo: 'cliente@prueba.pe'
    });
    component.step.set(2);

    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    expect(service.opciones).toHaveBeenCalledTimes(2);
    expect(component.step()).toBe(0);
    expect(component.form.controls.prefijo.value).toBe('51');
    expect(component.form.controls.lead.value).toBe('');
    expect(component.form.controls.nombreTitularServicio.value).toBe('');
    expect(component.form.controls.correo.value).toBeNull();
    expect(component.form.pristine).toBe(true);
  });

  it('pide confirmación antes de descartar datos y permite seguir editando', () => {
    const closed = vi.fn();
    component.close.subscribe(closed);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    component.form.controls.lead.setValue('999888777');
    component.form.controls.lead.markAsDirty();

    component.requestDismiss();

    expect(component.discardConfirmationOpen()).toBe(true);
    expect(closed).not.toHaveBeenCalled();
    component.continueEditing();
    expect(component.discardConfirmationOpen()).toBe(false);
    expect(component.form.controls.lead.value).toBe('999888777');

    component.requestDismiss();
    component.discardAndClose();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('limpia el expediente únicamente después de un guardado exitoso', () => {
    const saved = vi.fn();
    component.saved.subscribe(saved);
    fillValidForm();

    component.submit();

    expect(saved).toHaveBeenCalledWith(response);
    expect(component.form.controls.lead.value).toBe('');
    expect(component.form.controls.nombreTitularServicio.value).toBe('');
    expect(component.form.pristine).toBe(true);
    expect(component.step()).toBe(0);
  });

  it('conserva los datos y el drawer abierto cuando el guardado falla', () => {
    const saved = vi.fn();
    component.saved.subscribe(saved);
    service.crear.mockReturnValue(throwError(() => ({ error: { message: 'No se pudo registrar.' } })));
    fillValidForm();

    component.submit();

    expect(saved).not.toHaveBeenCalled();
    expect(component.form.controls.lead.value).toBe('999888777');
    expect(component.form.controls.nombreTitularServicio.value).toBe('Cliente de prueba');
    expect(component.error()).toBe('No se pudo registrar.');
    expect(component.form.dirty).toBe(true);
  });

  function fillValidForm(): void {
    component.form.patchValue({
      prefijo: '51',
      lead: '999888777',
      tipoDocumento: 'DNI',
      numeroDocumentoTitularServicio: '12345678',
      nombreTitularServicio: 'Cliente de prueba',
      celularRegistro: '999888777',
      celularGrabacion: '999888777',
      correo: 'cliente@prueba.pe',
      fechaNacimiento: '1990-01-01',
      ubigeoDomicilio: '150101',
      idDepartamentoDomicilio: 1,
      idProvinciaDomicilio: 2,
      idDistritoDomicilio: 3,
      tipoDomicilio: 'HOGAR',
      direccion: 'Av. Principal 123',
      referencia: 'Frente al parque',
      latitud: '-12.011912014367258',
      longitud: '-77.12235645202007',
      idProveedor: 4,
      idPlan: 5
    });
    component.form.markAsDirty();
  }
});
