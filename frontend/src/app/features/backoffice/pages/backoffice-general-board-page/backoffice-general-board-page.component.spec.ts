// @vitest-environment jsdom
import '@angular/compiler';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BackofficeGeneralBoardPageComponent,
  canDeactivateBackofficeGeneralBoard
} from './backoffice-general-board-page.component';
import { BackofficeLeadService } from '../../services/backoffice-lead.service';
import { CurrentUserProviderScopeService } from '../../../../core/services/current-user-provider-scope.service';
import { SessionService } from '../../../../core/services/session.service';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { LeadBandejaVentaResponse, LeadDetalleResponse } from '../../../../shared/models/preventa/preventa.models';

describe('BackofficeGeneralBoardPageComponent drawer lifecycle', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let fixture: ComponentFixture<BackofficeGeneralBoardPageComponent>;
  let component: BackofficeGeneralBoardPageComponent;
  let drawer: {
    onRowClick(value: LeadBandejaVentaResponse): Promise<void>;
    closeDrawer(): Promise<void>;
    drawerMode(): string;
    drawerOpen(): boolean;
    canMutateDrawer(): boolean;
    releaseError(): string | null;
    assignmentConflict(): { nombreAsesor: string } | null;
    consultaFromConflict: { set(value: boolean): void };
    continueFromConflict(): void;
    openingRequest: Promise<void>;
  };

  const row = { idLead: 51 } as LeadBandejaVentaResponse;
  const detail = { id: 51, etapa: 'VENTA', idAsesorAsignado: 8 } as LeadDetalleResponse;
  const page = { content: [], totalElements: 0 };

  afterEach(() => TestBed.resetTestingModule());

  beforeEach(() => {
    service = {
      abrirLead: vi.fn(() => of({ modo: 'GESTION', detalle: detail })),
      liberarAsignacion: vi.fn(() => of(undefined)),
      listarHistorialBackofficeVenta: vi.fn(() => of(page)),
      getCatalogoTipificaciones: vi.fn(() => of({ etapa: 'VENTA', tipificaciones: [] })),
      listarPlanesOferta: vi.fn(() => of([])),
      listarPromociones: vi.fn(() => of([])),
      listarAdicionales: vi.fn(() => of([])),
      listarBandejaVentaNormalizada: vi.fn(() => of(page)),
      obtenerDetalleConsulta: vi.fn(() => of(detail)),
      listarDepartamentos: vi.fn(() => of([])),
      listarProvincias: vi.fn(() => of([])),
      listarDistritos: vi.fn(() => of([])),
      listarPlanes: vi.fn(() => of([])),
      listarGestoresBandeja: vi.fn(() => of([])),
      getCatalogoPorProveedor: vi.fn(() => of([])),
      registrarContacto: vi.fn(() => of(undefined)),
      actualizarDatosPreventa: vi.fn(() => of(undefined)),
      actualizarDireccion: vi.fn(() => of(undefined)),
      actualizarOfertaComercial: vi.fn(() => of(undefined)),
      tipificarLead: vi.fn(() => of(undefined))
    };
    TestBed.overrideComponent(BackofficeGeneralBoardPageComponent, {
      set: { template: '', styles: [], styleUrl: '', imports: [] }
    });
    TestBed.configureTestingModule({
      imports: [BackofficeGeneralBoardPageComponent],
      providers: [
        { provide: BackofficeLeadService, useValue: service },
        { provide: CurrentUserProviderScopeService, useValue: { activeId: signal(1), load: vi.fn() } },
        { provide: LeadRealtimeService, useValue: { watchTopic: vi.fn(() => of()) } },
        { provide: SessionService, useValue: { getSession: vi.fn(() => ({ empleadoId: 8 })) } },
        { provide: ConfirmationService, useValue: { confirm: vi.fn() } }
      ]
    });
    fixture = TestBed.createComponent(BackofficeGeneralBoardPageComponent);
    component = fixture.componentInstance;
    drawer = component as unknown as typeof drawer;
    vi.spyOn(component as unknown as { loadRows: () => Promise<void> }, 'loadRows').mockResolvedValue(undefined);
  });

  it('usa el modo que devuelve el backend y libera la asignación al cerrar gestión', async () => {
    await drawer.onRowClick(row);
    expect(drawer.drawerMode()).toBe('gestion');
    expect(drawer.drawerOpen()).toBe(true);

    await drawer.closeDrawer();

    expect(service['liberarAsignacion']).toHaveBeenCalledWith(51);
    expect(drawer.drawerOpen()).toBe(false);
  });

  it('mantiene gestión abierta y permite reintentar si falla la liberación', async () => {
    await drawer.onRowClick(row);
    service['liberarAsignacion'].mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Unavailable' }))
    );

    await drawer.closeDrawer();
    expect(drawer.drawerOpen()).toBe(true);
    expect(drawer.releaseError()).toContain('HTTP 503');

    await drawer.closeDrawer();
    expect(drawer.drawerOpen()).toBe(false);
    expect(service['liberarAsignacion']).toHaveBeenCalledTimes(2);
  });

  it('abre el modo consulta elegido en el conflicto sin convertirlo en asignación', async () => {
    service['abrirLead']
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({
        status: 409,
        error: { details: { idAsesorActual: 12, nombreAsesorActual: 'María Responsable' } }
      })))
      .mockReturnValueOnce(of({ modo: 'CONSULTA', detalle: { ...detail, idAsesorAsignado: 12 } }));

    await drawer.onRowClick(row);
    expect(drawer.assignmentConflict()?.nombreAsesor)
      .toBe('María Responsable');
    drawer.consultaFromConflict.set(true);
    drawer.continueFromConflict();
    await drawer.openingRequest;

    expect(service['abrirLead'].mock.calls[1][1]).toEqual({ modoConsulta: true });
    expect(drawer.drawerMode()).toBe('consulta');
    expect(drawer.canMutateDrawer()).toBe(false);
    expect(service['liberarAsignacion']).not.toHaveBeenCalled();
  });

  it('aplica la misma liberación antes de permitir navegación', async () => {
    await drawer.onRowClick(row);
    service['liberarAsignacion'].mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Unavailable' }))
    );

    const canLeave = await component.canDeactivate();

    expect(canLeave).toBe(false);
    expect(drawer.drawerOpen()).toBe(true);
  });

  it('permite navegar cuando el router no entrega una instancia del componente', () => {
    const guard = canDeactivateBackofficeGeneralBoard as unknown as (component: null) => boolean;

    expect(guard(null)).toBe(true);
  });
});
