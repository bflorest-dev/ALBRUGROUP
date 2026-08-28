import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttendanceFacade } from '../../../core/facades/attendance.facade';
import { AsesorVentasWorkspaceStateService } from '../../../core/services/asesor-ventas-workspace-state.service';
import { BrowserSessionService } from '../../../core/services/browser-session.service';
import { OperationalGateService } from '../../../core/services/operational-gate.service';
import { PresenceService } from '../../../core/services/presence.service';
import { SessionService } from '../../../core/services/session.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import { resolveSalesAdvisorAvailability } from './asesor-ventas-workspace.facade';
import { AsesorVentasWorkspaceFacade } from './asesor-ventas-workspace.facade';

describe('resolveSalesAdvisorAvailability', () => {
  it.each([
    [0, 'DISPONIBLE'],
    [1, 'CON_LEADS'],
    [2, 'CON_LEADS'],
    [3, 'SIN_GESTIONAR'],
    [9, 'SIN_GESTIONAR'],
    [10, 'SATURADO']
  ] as const)('calcula %s leads como %s', (totalLeads, expected) => {
    expect(resolveSalesAdvisorAvailability('ONLINE', totalLeads, false)).toBe(expected);
  });

  it('prioriza la gestion activa mientras la bandeja no este saturada', () => {
    expect(resolveSalesAdvisorAvailability('ONLINE', 3, true)).toBe('GESTIONANDO');
  });

  it('prioriza la saturacion incluso con un lead abierto', () => {
    expect(resolveSalesAdvisorAvailability('ONLINE', 10, true)).toBe('SATURADO');
  });

  it.each(['ALMUERZO', 'SERVICIOS', 'CAPACITACION'] as const)('prioriza %s como ocupado', (status) => {
    expect(resolveSalesAdvisorAvailability(status, 0, false)).toBe('OCUPADO');
  });

  it('no publica disponibilidad cuando el asesor esta offline', () => {
    expect(resolveSalesAdvisorAvailability('OFFLINE', 4, false)).toBeNull();
  });
});

describe('AsesorVentasWorkspaceFacade', () => {
  let facade: AsesorVentasWorkspaceFacade;
  let preventaService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    preventaService = {
      tipificarLead: vi.fn(() => of(void 0)),
      listarLeadsAsesorVentas: vi.fn(() => of({ content: [], totalElements: 0, totalPages: 0 })),
      getDetalleAsesor: vi.fn(() => of(null)),
      getCatalogoTipificaciones: vi.fn(() => of({ tipificaciones: [] })),
      listarPlanes: vi.fn(() => of([])),
      listarPromociones: vi.fn(() => of([])),
      listarAdicionales: vi.fn(() => of([])),
      listarDepartamentos: vi.fn(() => of([])),
      listarProvincias: vi.fn(() => of([])),
      listarDistritos: vi.fn(() => of([])),
      listarCamposCapturaProveedor: vi.fn(() => of([]))
    };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        AsesorVentasWorkspaceFacade,
        {
          provide: BrowserSessionService,
          useValue: {
            getActiveLeadId: vi.fn(() => null),
            setActiveLeadId: vi.fn(),
            clearActiveLeadId: vi.fn()
          }
        },
        {
          provide: AsesorVentasWorkspaceStateService,
          useValue: {
            getActiveLeadId: vi.fn(() => null),
            setActiveLeadId: vi.fn(),
            clearActiveLeadId: vi.fn()
          }
        },
        {
          provide: OperationalGateService,
          useValue: {
            currentStatus: vi.fn(() => 'ONLINE'),
            isConfirmedOffline: vi.fn(() => false),
            createGate: vi.fn(() => ({
              canDisplayOperationalData: vi.fn(() => false),
              canMutateOperationalData: vi.fn(() => false),
              canActivateOperationalData: vi.fn(() => false)
            }))
          }
        },
        {
          provide: AttendanceFacade,
          useValue: {
            isPastSalida: vi.fn(() => false),
            setManagingLeadActive: vi.fn()
          }
        },
        {
          provide: PresenceService,
          useValue: {
            actualizarDisponibilidad: vi.fn(() => Promise.resolve())
          }
        },
        {
          provide: SessionService,
          useValue: {
            getSession: vi.fn(() => ({ empleadoId: 7, primaryRole: 'ASESOR_VENTAS' }))
          }
        },
        {
          provide: LeadRealtimeService,
          useValue: {
            watchTopic: vi.fn(() => of())
          }
        },
        {
          provide: PreventaLeadService,
          useValue: preventaService
        }
      ]
    });

    facade = TestBed.inject(AsesorVentasWorkspaceFacade);
  });

  it('bloquea el cierre de PREVENTA cuando el lead no tiene numero', async () => {
    facade.detail.set({
      id: 25202,
      prefijo: null,
      lead: null,
      usermeta: 'micky.bautista.501902',
      estadoSeguimiento: 'EN_GESTION',
      atencionOtraEtapa: false
    } as never);
    facade.isManagingLead.set(true);
    facade.catalogo.set({
      tipificaciones: [
        {
          codigo: 'PREVENTA_COMPLETA',
          descripcion: 'Gestion de preventa finalizada',
          orden: 1,
          subtipificaciones: [
            {
              codigo: 'VENTA_CERRADA',
              descripcion: 'Venta cerrada',
              orden: 1,
              comportamientos: ['ES_CIERRE_PREVENTA']
            }
          ]
        }
      ]
    } as never);
    facade.selectedTipificacionCode.set('PREVENTA_COMPLETA');
    facade.selectedSubtipificacionCode.set('VENTA_CERRADA');
    facade.tipificacionForm.patchValue({
      codigoTipificacion: 'PREVENTA_COMPLETA',
      codigoSubtipificacion: 'VENTA_CERRADA'
    });

    await facade.tipificar();

    expect(facade.identidadEditorOpen()).toBe(true);
    expect(facade.errorMessage()).toBe('Para cerrar la venta, completa el numero de lead.');
    expect(preventaService['tipificarLead']).not.toHaveBeenCalled();
  });
});
