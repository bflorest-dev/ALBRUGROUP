import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  CampanaResponse,
  LeadGtrLookupResponse,
  LeadGtrMetricasResponse,
  LeadIntakeRequest,
  LeadIntakeRetroactivoRequest
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
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';

const PERU_PHONE_PREFIX = '+51';
const PERU_LEAD_PATTERN = /^9\d{8}$/;
const INTERNATIONAL_LEAD_PATTERN = /^\d{6,15}$/;
const USERMETA_PATTERN = /^@?[A-Za-z0-9._-]+$/;
const CLARO_PROVIDER_NAME = 'CLARO';
const CLARO_HIDDEN_TEAM_ID = 5;
// Ventana original: descomentar al restaurar la restricción horaria.
// const RESTRICT_RETROACTIVE_INTAKE_BY_TIME = true;

type SelectOption<T> = {
  label: string;
  value: T;
};

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
  readonly intakeError = signal('');

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
  readonly intakeConfirmationVisible = signal(false);
  readonly pendingIntakeLookup = signal<LeadGtrLookupResponse | null>(null);
  readonly intakeMode = signal<'normal' | 'retroactivo'>('normal');
  private readonly currentOperationalClock = signal(new Date());
  private retroactiveWindowTimerId: number | null = null;
  readonly retroactiveDateControl = new FormControl<string | null>(null, {
    validators: [Validators.required]
  });
  readonly retroactiveHourControl = new FormControl<Date | null>(this.createTimeValue(19, 0), {
    validators: [Validators.required]
  });
  readonly retroactiveDateOptions = computed<SelectOption<string>[]>(() => {
    const now = this.currentOperationalClock();
    const today = this.limaDateValue(now);
    const yesterday = this.previousLimaDateValue(now);
    return [
      { value: yesterday, label: `Ayer — ${this.limaDateLabel(yesterday)}` },
      { value: today, label: `Hoy — ${this.limaDateLabel(today)}` }
    ];
  });
  readonly isRetroactiveIntake = computed(() => this.intakeMode() === 'retroactivo');
  readonly canShowRetroactiveIntake = computed(() => {
    // Temporalmente disponible fuera de la ventana 04:00-08:59 para facilitar las pruebas.
    // Cuando se solicite restaurar la restricción, descomentar la constante y estas líneas, y quitar `return true`:
    // if (!RESTRICT_RETROACTIVE_INTAKE_BY_TIME) return true;
    // const hour = this.getLimaDateParts(this.currentOperationalClock()).hour;
    // return hour >= 4 && hour < 9;
    return true;
  });
  readonly intakeDialogTitle = computed(() =>
    this.isRetroactiveIntake() ? 'Registrar lead con fecha alternativa (Supervisor)' : 'Nuevo Lead (Supervisor)'
  );

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
    this.intakeForm.controls.idCampana.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idCampana) => {
        this.intakeCampanaId.set(idCampana == null ? null : Number(idCampana));
        this.syncIntakeOriginWithCampaign();
      });

    effect(() => {
      const idProveedor = this.providerScope.activeId();
      if (!this.initialized || idProveedor == null) return;
      void this.recargarPorProveedor(idProveedor);
    });

    this.startRetroactiveWindowClock();
    this.destroyRef.onDestroy(() => this.stopRetroactiveWindowClock());
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
      const scopeLoaded = await this.providerScope.load();
      if (!scopeLoaded) {
        throw new Error('No se pudo consultar el scope de proveedores. Intenta nuevamente.');
      }
      const idProveedor = this.providerScope.activeId();
      if (idProveedor == null || this.providerScope.proveedorActivo() == null) {
        throw new Error('El supervisor no tiene proveedores asignados en el ámbito PREVENTA.');
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
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la información. Intenta nuevamente.');
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
    this.intakeMode.set('normal');
    this.prepareIntakeDialog();
  }

  abrirRetroactiveIntakeDialog(): void {
    if (this.providerScope.activeId() == null) {
      this.error.set('Selecciona un proveedor activo antes de registrar un lead.');
      return;
    }
    if (!this.canShowRetroactiveIntake()) {
      this.error.set('El registro con fecha alternativa solo está disponible hasta las 09:00.');
      return;
    }
    this.intakeMode.set('retroactivo');
    this.prepareIntakeDialog();
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
    await this.submitIntakeInternal(false);
  }

  async confirmIntakeRegistration(): Promise<void> {
    await this.submitIntakeInternal(true);
  }

  cancelIntakeConfirmation(): void {
    this.pendingIntakeLookup.set(null);
    this.intakeError.set('');
    this.intakeConfirmationVisible.set(false);
    this.intakeDialogVisible.set(true);
  }

  intakeConfirmationMessage(): string {
    const lookup = this.pendingIntakeLookup();
    if (!lookup?.existe) return '';

    if (lookup.etapaActual === 'PREVENTA') {
      return 'Este lead ya se encuentra registrado en el sistema. Regístralo nuevamente solo si se ha vuelto a comunicar por un canal de nuestras campañas.';
    }

    const contextMessage = lookup.mensajeUsuario
      ?? 'Este lead ya se encuentra registrado en el sistema y no puede gestionarse desde GTR por el momento.';
    return `${contextMessage}\nRegístralo nuevamente solo si se ha vuelto a comunicar por un canal de nuestras campañas.`;
  }

  intakeUsermetaLabel(value?: string | null): string {
    const normalized = normalizeUsermeta(value);
    return normalized ? `@${normalized}` : '';
  }

  private async submitIntakeInternal(skipLookupConfirmation: boolean): Promise<void> {
    if (this.intakeForm.invalid || !this.isRetroactiveDateValid() || !this.isRetroactiveHourValid() || this.intakeSubmitting()) return;

    this.intakeSubmitting.set(true);
    this.error.set('');
    this.exito.set('');
    this.intakeError.set('');
    try {
      const v = this.intakeForm.getRawValue();
      const leadNumber = String(v.lead ?? '').trim();
      const hasPhone = !!leadNumber;
      const request: LeadIntakeRequest = {
        // El prefijo predeterminado es solo visual hasta que exista un número.
        // Un registro por usermeta no debe enviarlo como teléfono incompleto.
        prefijo: hasPhone ? v.prefijo : null,
        lead: hasPhone ? leadNumber : null,
        usermeta: normalizeUsermeta(v.usermeta) || null,
        idCampana: v.idCampana ?? null,
        idOrigen: v.idOrigen!
      };

      if (!skipLookupConfirmation) {
        const lookupValue = request.lead || request.usermeta || '';
        const lookup = await firstValueFrom(this.preventaService.buscarContextoLeadGtr(lookupValue));
        if (lookup.existe) {
          this.pendingIntakeLookup.set(lookup);
          this.intakeError.set('');
          this.intakeDialogVisible.set(false);
          this.intakeConfirmationVisible.set(true);
          return;
        }
      }

      const isRetroactive = this.isRetroactiveIntake();
      const retroactiveDate = this.retroactiveDateControl.value;
      const retroactiveTime = this.toApiTime(this.retroactiveHourControl.value);
      if (isRetroactive) {
        if (!retroactiveDate || !retroactiveTime) {
          this.intakeError.set('Selecciona una fecha y hora válidas para el registro alternativo.');
          return;
        }
        const retroactiveRequest: LeadIntakeRetroactivoRequest = {
          ...request,
          fechaRegistro: retroactiveDate,
          horaRegistro: retroactiveTime
        };
        await firstValueFrom(this.preventaService.registrarIngresoLeadSupervisorRetroactivo(retroactiveRequest));
      } else {
        await firstValueFrom(this.preventaService.registrarIngresoLeadSupervisor(request));
      }
      this.exito.set(
        isRetroactive && retroactiveDate && retroactiveTime
          ? `Lead registrado correctamente con fecha ${this.retroactiveDateLabel()} a las ${retroactiveTime}.`
          : 'Lead registrado correctamente.'
      );
      this.intakeDialogVisible.set(false);
      this.intakeConfirmationVisible.set(false);
      this.pendingIntakeLookup.set(null);
      this.intakeMode.set('normal');
      await this.cargarLeadsSinEquipo(0);
    } catch (error) {
      this.intakeError.set(this.getIntakeErrorMessage(error));
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

  isRetroactiveDateValid(): boolean {
    if (!this.isRetroactiveIntake()) return true;
    const value = this.retroactiveDateControl.value;
    return !!value && this.retroactiveDateOptions().some((option) => option.value === value);
  }

  isRetroactiveHourValid(): boolean {
    if (!this.isRetroactiveIntake()) return true;
    if (!this.isRetroactiveDateValid()) return false;
    const value = this.retroactiveHourControl.value;
    if (!value || Number.isNaN(value.getTime())) return false;

    const minutes = value.getHours() * 60 + value.getMinutes();
    const today = this.limaDateValue(this.currentOperationalClock());
    if (this.retroactiveDateControl.value === today) {
      const current = this.getLimaDateParts(this.currentOperationalClock());
      return minutes <= current.hour * 60 + current.minute;
    }
    return minutes >= 18 * 60 && minutes <= 23 * 60 + 59;
  }

  retroactiveDateLabel(): string {
    const selected = this.retroactiveDateControl.value;
    return this.retroactiveDateOptions().find((option) => option.value === selected)?.label
      ?? this.retroactiveDateOptions()[0]?.label
      ?? 'Ayer';
  }

  retroactiveHourLabel(): string {
    return this.toApiTime(this.retroactiveHourControl.value) ?? '19:00';
  }

  retroactiveHourHint(): string {
    return this.retroactiveDateControl.value === this.limaDateValue(this.currentOperationalClock())
      ? 'Desde las 00:00 hasta la hora actual de Lima'
      : 'Entre 18:00 y 23:59';
  }

  retroactiveMinTime(): Date {
    return this.retroactiveDateControl.value === this.limaDateValue(this.currentOperationalClock())
      ? this.createTimeValue(0, 0)
      : this.createTimeValue(18, 0);
  }

  retroactiveMaxTime(): Date {
    if (this.retroactiveDateControl.value !== this.limaDateValue(this.currentOperationalClock())) {
      return this.createTimeValue(23, 59);
    }
    const current = this.getLimaDateParts(this.currentOperationalClock());
    return this.createTimeValue(current.hour, current.minute);
  }

  onRetroactiveDateChange(): void {
    if (!this.isRetroactiveIntake()) return;
    const current = this.getLimaDateParts(this.currentOperationalClock());
    const selectedToday = this.retroactiveDateControl.value === this.limaDateValue(this.currentOperationalClock());
    const currentMinutes = current.hour * 60 + current.minute;
    const selectedMinutes = this.retroactiveHourControl.value
      ? this.retroactiveHourControl.value.getHours() * 60 + this.retroactiveHourControl.value.getMinutes()
      : null;
    const valid = selectedToday
      ? selectedMinutes !== null && selectedMinutes <= currentMinutes
      : selectedMinutes !== null && selectedMinutes >= 18 * 60 && selectedMinutes <= 23 * 60 + 59;
    if (!valid) {
      this.retroactiveHourControl.setValue(
        selectedToday ? this.createTimeValue(current.hour, current.minute) : this.createTimeValue(19, 0)
      );
    }
  }

  // ── Validators ─────────────────────────────────────────────────────

  private prepareIntakeDialog(): void {
    this.resetIntakeForm();
    this.intakeError.set('');
    this.pendingIntakeLookup.set(null);
    this.intakeConfirmationVisible.set(false);
    this.exito.set('');
    this.error.set('');
    this.intakeDialogVisible.set(true);
  }

  private resetIntakeForm(): void {
    this.intakeForm.reset({
      prefijo: PERU_PHONE_PREFIX,
      lead: '',
      usermeta: '',
      idCampana: null,
      idOrigen: null
    });
    this.intakeCampanaId.set(null);
    this.updateIntakeLeadValidation(this.intakeForm.controls.prefijo.value);
    this.retroactiveDateControl.reset(this.previousLimaDateValue(this.currentOperationalClock()));
    this.retroactiveDateControl.markAsPristine();
    this.retroactiveDateControl.markAsUntouched();
    this.retroactiveHourControl.reset(this.createTimeValue(19, 0));
    this.retroactiveHourControl.markAsPristine();
    this.retroactiveHourControl.markAsUntouched();
    this.intakeForm.markAsPristine();
    this.intakeForm.markAsUntouched();
  }

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

  private syncIntakeOriginWithCampaign(): void {
    const allowedValues = new Set(this.origenesDisponibles().map((origen) => origen.id));
    const current = this.intakeForm.controls.idOrigen.value;
    if (current && allowedValues.has(current)) {
      return;
    }

    const first = this.origenesDisponibles()[0]?.id ?? null;
    this.intakeForm.controls.idOrigen.setValue(this.intakeCampanaId() ? first : null);
  }

  private getIntakeErrorMessage(error: unknown): string {
    const fallback = 'No se pudo registrar el lead. Verifica los datos e intenta nuevamente.';
    if (error instanceof HttpErrorResponse) {
      return formatApiErrorMessage(error.error, fallback);
    }
    return error instanceof Error && error.message ? error.message : fallback;
  }

  private startRetroactiveWindowClock(): void {
    this.currentOperationalClock.set(new Date());
    this.normalizeRetroactiveDateSelection();
    if (this.retroactiveWindowTimerId !== null) return;
    this.retroactiveWindowTimerId = window.setInterval(() => {
      this.currentOperationalClock.set(new Date());
      this.normalizeRetroactiveDateSelection();
    }, 60_000);
  }

  private stopRetroactiveWindowClock(): void {
    if (this.retroactiveWindowTimerId === null) return;
    window.clearInterval(this.retroactiveWindowTimerId);
    this.retroactiveWindowTimerId = null;
  }

  private createTimeValue(hours: number, minutes: number): Date {
    const value = new Date();
    value.setHours(hours, minutes, 0, 0);
    return value;
  }

  private toApiTime(value: Date | null): string | null {
    if (!value) return null;
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  private getLimaDateParts(date: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  } {
    const values = new Map(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      })
        .formatToParts(date)
        .map((part) => [part.type, part.value])
    );
    return {
      year: Number(values.get('year')),
      month: Number(values.get('month')),
      day: Number(values.get('day')),
      hour: Number(values.get('hour')),
      minute: Number(values.get('minute'))
    };
  }

  private limaDateValue(date: Date): string {
    const current = this.getLimaDateParts(date);
    return `${current.year}-${String(current.month).padStart(2, '0')}-${String(current.day).padStart(2, '0')}`;
  }

  private previousLimaDateValue(date: Date): string {
    const current = this.getLimaDateParts(date);
    const previousDate = new Date(Date.UTC(current.year, current.month - 1, current.day - 1, 12));
    return `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, '0')}-${String(previousDate.getUTCDate()).padStart(2, '0')}`;
  }

  private limaDateLabel(value: string): string {
    const date = new Date(`${value}T12:00:00Z`);
    const label = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'UTC',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private normalizeRetroactiveDateSelection(): void {
    const selected = this.retroactiveDateControl.value;
    if (selected && this.retroactiveDateOptions().some((option) => option.value === selected)) return;
    this.retroactiveDateControl.setValue(this.previousLimaDateValue(this.currentOperationalClock()));
    this.onRetroactiveDateChange();
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
