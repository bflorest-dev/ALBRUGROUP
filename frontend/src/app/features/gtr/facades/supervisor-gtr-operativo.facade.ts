import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  CampanaResponse,
  LeadGtrMetricasResponse,
  LeadIntakeRequest
} from '../../../shared/models/preventa/preventa.models';
import {
  EquipoOperativoResponse,
  LeadSupervisorSinEquipoResponse,
  PreventaLeadService
} from '../../preventa/services/preventa-lead.service';
import { OrigenResponse } from '../../admin/services/base-leads.service';
import { GtrTeamCampaignService } from '../services/gtr-team-campaign.service';
import { AsesorGtrPresenceResponse, PresenceService } from '../../../core/services/presence.service';
import { CurrentUserProviderScopeService } from '../../../core/services/current-user-provider-scope.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';

const PERU_PHONE_PREFIX = '+51';
const PERU_LEAD_PATTERN = /^9\d{8}$/;
const INTERNATIONAL_LEAD_PATTERN = /^\d{6,15}$/;
const USERMETA_PATTERN = /^@?[A-Za-z0-9._-]+$/;
const CLARO_PROVIDER_NAME = 'CLARO';
const CLARO_HIDDEN_TEAM_ID = 5;

function normalizeUsermeta(value: unknown): string {
  const raw = String(value ?? '').trim();
  return raw.startsWith('@') ? raw.substring(1) : raw;
}

@Injectable()
export class SupervisorGtrOperativoFacade {
  private readonly preventaService = inject(PreventaLeadService);
  private readonly teamService = inject(GtrTeamCampaignService);
  private readonly presenceService = inject(PresenceService);
  private readonly providerScope = inject(CurrentUserProviderScopeService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  // ── State signals ───────────────────────────────────────────────────
  readonly equipos = signal<EquipoOperativoResponse[]>([]);
  readonly leadsSinEquipo = signal<LeadSupervisorSinEquipoResponse[]>([]);
  readonly totalLeadsSinEquipo = signal(0);
  readonly metricasPorEquipo = signal<Map<number, LeadGtrMetricasResponse>>(new Map());
  readonly asesoresConectados = signal<AsesorGtrPresenceResponse[]>([]);
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly origenes = signal<OrigenResponse[]>([]);
  readonly intakeCampanaId = signal<number | null>(null);

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  // Intake
  readonly intakeNumberMaxLength = signal(9);
  readonly intakeNumberInvalidMessage = computed(() =>
    this.intakeNumberMaxLength() === 9
      ? 'Ingresa un celular válido de 9 dígitos que empiece con 9.'
      : 'Ingresa un número válido para el prefijo seleccionado.'
  );
  readonly intakeForm = this.fb.group({
    prefijo: [PERU_PHONE_PREFIX, [Validators.pattern(/^\+\d{1,3}$/)]],
    lead: ['', [Validators.pattern(PERU_LEAD_PATTERN)]],
    usermeta: ['', [Validators.pattern(USERMETA_PATTERN)]],
    idCampana: [null as number | null],
    idOrigen: [null as number | null, [Validators.required]]
  }, { validators: SupervisorGtrOperativoFacade.intakeIdentityValidator });
  readonly intakeSubmitting = signal(false);
  readonly intakeDialogVisible = signal(false);

  // Equipo assignment
  readonly asignacionDialogVisible = signal(false);
  readonly leadParaAsignar = signal<LeadSupervisorSinEquipoResponse | null>(null);
  readonly equipoSeleccionadoId = signal<number | null>(null);
  readonly asignandoEquipo = signal(false);

  // Pagination
  readonly paginaActual = signal(0);

  readonly proveedorActivo = this.providerScope.proveedorActivo;
  private initialized = false;
  private realtimeStarted = false;

  constructor() {
    this.updateIntakeLeadValidation(this.intakeForm.controls.prefijo.value);
    this.intakeForm.controls.prefijo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((prefijo) => this.updateIntakeLeadValidation(prefijo));

    effect(() => {
      const idProveedor = this.providerScope.activeId();
      if (!this.initialized || idProveedor == null) return;
      void this.recargarPorProveedor(idProveedor);
    });
  }

  // ── Computed ────────────────────────────────────────────────────────
  readonly equiposActivos = computed(() => this.filtrarEquiposVisibles(this.equipos()));

  readonly campanasDelProveedor = computed(() => {
    const provId = this.providerScope.activeId();
    if (provId == null) return this.campanas();
    return this.campanas().filter(c => c.idProveedor === provId);
  });

  readonly origenesDisponibles = computed(() => {
    const tieneCampana = this.intakeCampanaId() != null;
    return this.origenes().filter(origen => origen.esCampana === tieneCampana);
  });

  readonly asesoresPorEquipo = computed(() => {
    const map = new Map<number, number>();
    for (const asesor of this.asesoresConectados()) {
      if (asesor.equipoActivoId && asesor.operativo) {
        map.set(asesor.equipoActivoId, (map.get(asesor.equipoActivoId) ?? 0) + 1);
      }
    }
    return map;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────

  async inicializar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      await this.providerScope.load();
      const idProveedor = this.providerScope.activeId();
      if (idProveedor == null || this.providerScope.proveedorActivo() == null) {
        throw new Error('El supervisor no tiene un proveedor activo asignado.');
      }

      const [equipos, leadsSinEquipo, asesores, campanas, origenes] = await Promise.all([
        firstValueFrom(this.teamService.listarEquiposPorProveedor(idProveedor)).catch(() => []),
        firstValueFrom(this.preventaService.listarLeadsSinEquipo({ size: 20 })).catch(() => ({ content: [], totalElements: 0 })),
        firstValueFrom(this.presenceService.listarAsesoresConectadosGtr()).catch(() => []),
        firstValueFrom(this.preventaService.listarCampanasActivas(null, idProveedor)).catch(() => []),
        firstValueFrom(this.preventaService.listarOrigenes()).catch(() => [])
      ]);
      const equiposActivos = this.filtrarEquiposVisibles(equipos ?? []);
      this.equipos.set(equiposActivos);
      this.leadsSinEquipo.set(leadsSinEquipo?.content ?? []);
      this.totalLeadsSinEquipo.set(leadsSinEquipo?.totalElements ?? 0);
      this.asesoresConectados.set(asesores ?? []);
      this.campanas.set((campanas ?? []).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      this.origenes.set(origenes ?? []);
      this.intakeCampanaId.set(null);
      this.initialized = true;
      this.startRealtime();
      await this.cargarMetricasEquipos(equiposActivos);
    } catch {
      this.error.set('No se pudo cargar la información. Intenta nuevamente.');
    } finally {
      this.cargando.set(false);
    }
  }

  private startRealtime(): void {
    if (this.realtimeStarted) return;
    this.realtimeStarted = true;

    this.realtimeService.watchTopic('/topic/leads/etapa/PREVENTA')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (!this.initialized || !['REGISTRO', 'REGISTRO_MASIVO', 'ASIGNACION'].includes(event.tipo)) {
            return;
          }
          void Promise.all([
            this.cargarLeadsSinEquipo(this.paginaActual()),
            this.cargarMetricasEquipos()
          ]);
        },
        error: () => undefined
      });
  }

  private async recargarPorProveedor(idProveedor: number): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [equipos, campanas] = await Promise.all([
        firstValueFrom(this.teamService.listarEquiposPorProveedor(idProveedor)),
        firstValueFrom(this.preventaService.listarCampanasActivas(null, idProveedor))
      ]);
      const equiposActivos = this.filtrarEquiposVisibles(equipos ?? []);
      this.equipos.set(equiposActivos);
      this.campanas.set((campanas ?? []).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      this.intakeCampanaId.set(null);
      this.intakeForm.controls.idCampana.setValue(null);
      await Promise.all([
        this.cargarLeadsSinEquipo(0),
        this.cargarMetricasEquipos(equiposActivos)
      ]);
    } catch {
      this.error.set('No se pudo cargar la información del proveedor seleccionado.');
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Metrics ────────────────────────────────────────────────────────

  private filtrarEquiposVisibles(equipos: EquipoOperativoResponse[]): EquipoOperativoResponse[] {
    const activos = equipos
      .filter(e => e.activo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    const proveedor = this.proveedorActivo()?.nombre.trim().toUpperCase();
    if (proveedor !== CLARO_PROVIDER_NAME) return activos;
    return activos.filter(equipo => equipo.id !== CLARO_HIDDEN_TEAM_ID);
  }

  async cargarMetricasEquipos(equipos?: EquipoOperativoResponse[]): Promise<void> {
    const lista = equipos ?? this.equiposActivos();
    if (lista.length === 0) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const results = await Promise.all(
        lista.map(async (equipo) => {
          const metricas = await firstValueFrom(this.preventaService.obtenerMetricasGtr(today, equipo.id));
          return [equipo.id, metricas] as const;
        })
      );
      const map = new Map<number, LeadGtrMetricasResponse>();
      for (const [id, metricas] of results) {
        map.set(id, metricas);
      }
      this.metricasPorEquipo.set(map);
    } catch {
      // Metrics are non-critical
    }
  }

  // ── Bandeja sin equipo ─────────────────────────────────────────────

  async cargarLeadsSinEquipo(page = 0): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.preventaService.listarLeadsSinEquipo({ page, size: 20 })
      );
      this.leadsSinEquipo.set(response?.content ?? []);
      this.totalLeadsSinEquipo.set(response?.totalElements ?? 0);
      this.paginaActual.set(page);
    } catch {
      this.error.set('No se pudo cargar los leads sin equipo.');
    }
  }

  // ── Intake ─────────────────────────────────────────────────────────

  abrirIntakeDialog(): void {
    if (this.providerScope.activeId() == null) {
      this.error.set('Selecciona un proveedor activo antes de registrar un lead.');
      return;
    }
    this.intakeForm.reset({
      prefijo: PERU_PHONE_PREFIX, lead: '', usermeta: '',
      idCampana: null, idOrigen: null
    });
    this.intakeCampanaId.set(null);
    this.exito.set('');
    this.error.set('');
    this.intakeDialogVisible.set(true);
  }

  seleccionarCampanaIntake(idCampana: number | null): void {
    this.intakeCampanaId.set(idCampana);
    const origenActual = this.intakeForm.controls.idOrigen.value;
    const permitido = this.origenesDisponibles().some(origen => origen.id === origenActual);
    if (!permitido) {
      this.intakeForm.controls.idOrigen.setValue(null);
    }
  }

  intakeIdentityMessage(): string | null {
    if (!this.intakeForm.touched && !this.intakeForm.dirty) return null;
    const errors = this.intakeForm.errors;
    if (errors?.['phoneIncomplete']) {
      return 'Completa prefijo y número, o registra el usuario WhatsApp.';
    }
    if (errors?.['identityRequired']) {
      return 'Ingresa un teléfono completo o un usuario WhatsApp.';
    }
    if (this.intakeForm.controls.usermeta.invalid) {
      return 'El usuario WhatsApp solo puede usar letras, números, punto, guion y guion bajo.';
    }
    return null;
  }

  async submitIntake(): Promise<void> {
    if (this.intakeForm.invalid || this.intakeSubmitting()) return;

    this.intakeSubmitting.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      const v = this.intakeForm.getRawValue();
      const request: LeadIntakeRequest = {
        prefijo: v.prefijo || undefined,
        lead: v.lead || undefined,
        usermeta: normalizeUsermeta(v.usermeta) || undefined,
        idCampana: v.idCampana ?? undefined,
        idOrigen: v.idOrigen!
      };
      await firstValueFrom(this.preventaService.registrarIngresoLeadSupervisor(request));
      this.exito.set('Lead registrado correctamente.');
      this.intakeDialogVisible.set(false);
      await this.cargarLeadsSinEquipo(0);
    } catch {
      this.error.set('No se pudo registrar el lead. Verifica los datos e intenta nuevamente.');
    } finally {
      this.intakeSubmitting.set(false);
    }
  }

  // ── Equipo assignment ──────────────────────────────────────────────

  abrirAsignacionDialog(lead: LeadSupervisorSinEquipoResponse): void {
    this.leadParaAsignar.set(lead);
    this.equipoSeleccionadoId.set(null);
    this.asignacionDialogVisible.set(true);
  }

  cerrarAsignacionDialog(): void {
    this.asignacionDialogVisible.set(false);
    this.leadParaAsignar.set(null);
  }

  async asignarEquipo(): Promise<void> {
    const lead = this.leadParaAsignar();
    const idEquipo = this.equipoSeleccionadoId();
    if (!lead || !idEquipo || this.asignandoEquipo()) return;
    if (!this.equiposActivos().some(equipo => equipo.id === idEquipo)) {
      this.error.set('El equipo seleccionado no está disponible para este proveedor.');
      return;
    }

    this.asignandoEquipo.set(true);
    this.error.set('');
    this.exito.set('');
    try {
      await firstValueFrom(this.preventaService.asignarEquipoLead(lead.id, idEquipo));
      const equipoNombre = this.equipos().find(e => e.id === idEquipo)?.nombre ?? '';
      this.exito.set(`Lead asignado al equipo ${equipoNombre}.`);
      this.asignacionDialogVisible.set(false);
      this.leadParaAsignar.set(null);
      await Promise.all([
        this.cargarLeadsSinEquipo(this.paginaActual()),
        this.cargarMetricasEquipos()
      ]);
    } catch {
      this.error.set('No se pudo asignar el equipo al lead.');
    } finally {
      this.asignandoEquipo.set(false);
    }
  }

  // ── Validators ─────────────────────────────────────────────────────

  private updateIntakeLeadValidation(prefijo?: string | null): void {
    const isPeruPrefix = prefijo === PERU_PHONE_PREFIX;
    const leadControl = this.intakeForm.controls.lead;
    this.intakeNumberMaxLength.set(isPeruPrefix ? 9 : 15);
    leadControl.setValidators([
      Validators.pattern(isPeruPrefix ? PERU_LEAD_PATTERN : INTERNATIONAL_LEAD_PATTERN)
    ]);
    leadControl.updateValueAndValidity({ emitEvent: false });
    this.intakeForm.updateValueAndValidity({ emitEvent: false });
  }

  private static intakeIdentityValidator(control: AbstractControl): { identityRequired?: true; phoneIncomplete?: true } | null {
    const group = control as FormGroup;
    const prefijo = String(group.get('prefijo')?.value ?? '').trim();
    const lead = String(group.get('lead')?.value ?? '').trim();
    const usermeta = normalizeUsermeta(group.get('usermeta')?.value);
    const hasPhone = !!prefijo && !!lead;
    const hasPartialPhone = (!!prefijo && !lead) || (!prefijo && !!lead);
    if (hasPartialPhone && !usermeta) {
      return { phoneIncomplete: true };
    }
    return hasPhone || !!usermeta ? null : { identityRequired: true };
  }
}
