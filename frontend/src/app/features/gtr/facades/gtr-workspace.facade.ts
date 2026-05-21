import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  AsesorGtrPresenceResponse,
  ConnectedUserResponse,
  PresenceService
} from '../../../core/services/presence.service';
import { AttendanceRealtimeService } from '../../../core/services/attendance-realtime.service';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import {
  CampanaResponse,
  LeadGtrResponse,
  LeadGtrMetricasResponse,
  PageQuery
} from '../../../shared/models/preventa/preventa.models';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';

type VisualLeadGtr = LeadGtrResponse & { isNew?: boolean };

type AdvisorOption = {
  empleadoId: number;
  nombreCompleto: string;
  connected: boolean;
  operativo: boolean;
  disponibilidad?: string | null;
  estadoSchedule?: string | null;
  esperadoHoy?: boolean;
  lastSeen?: string | null;
};

type GtrDialog = 'lead' | 'snapshot' | 'assign' | null;

type LoadError = {
  label: string;
  message: string;
};

@Injectable()
export class GtrWorkspaceFacade {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly attendanceRealtimeService = inject(AttendanceRealtimeService);
  private readonly presenceService = inject(PresenceService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private presencePollingId: number | null = null;
  private attendanceRefreshId: number | null = null;

  readonly today = this.formatLocalDate(new Date());
  readonly isLoading = signal(false);
  readonly isReconciling = signal(false);
  readonly isSaving = signal(false);
  readonly isSavingSnapshot = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly rows = signal<VisualLeadGtr[]>([]);
  readonly metrics = signal<LeadGtrMetricasResponse>({
    nuevos: 0,
    sinGestionar: 0,
    gestionados: 0,
    preventas: 0
  });
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageNumber = signal(0);
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly advisors = signal<AdvisorOption[]>([]);
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly activeDialog = signal<GtrDialog>(null);
  readonly activeAssignmentLead = signal<LeadGtrResponse | null>(null);
  readonly advisorsPanelOpen = signal(false);

  readonly intakeForm = this.fb.group({
    prefijo: ['+51', [Validators.required, Validators.pattern(/^\+\d{2,3}$/)]],
    lead: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
    idCampana: [0, [Validators.required, Validators.min(1)]],
    base: ['WHATSAPP', [Validators.required]]
  });

  readonly assignmentForm = this.fb.group({
    idAsesorAsignado: [0, [Validators.required, Validators.min(1)]]
  });

  readonly snapshotForm = this.fb.group({
    idLead: [0, [Validators.required, Validators.min(1)]],
    numeroDocumentoTitularServicio: [''],
    direccion: ['']
  });

  readonly metricCards = computed(() => {
    const metrics = this.metrics();
    return [
      { label: 'Nuevos', value: metrics.nuevos, tone: 'blue' },
      { label: 'Sin Gestionar', value: metrics.sinGestionar, tone: 'amber' },
      { label: 'Gestionados', value: metrics.gestionados, tone: 'green' },
      { label: 'Preventas', value: metrics.preventas, tone: 'violet' }
    ];
  });

  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly selectedAdvisor = computed(() => {
    const advisorId = this.assignmentForm.controls.idAsesorAsignado.value;
    return this.advisors().find((advisor) => advisor.empleadoId === advisorId) ?? null;
  });
  readonly selectedSnapshotLead = computed(() => {
    const idLead = this.snapshotForm.controls.idLead.value;
    return this.rows().find((row) => row.id === idLead) ?? null;
  });

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  start(): void {
    void this.initialize();
    this.startRealtime();
    this.startPresencePolling();
    this.document.defaultView?.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  stop(): void {
    this.realtimeSubscription.unsubscribe();
    this.stopPresencePolling();
    this.stopAttendanceRefresh();
    this.document.defaultView?.removeEventListener('visibilitychange', this.handleVisibilityChange);

    for (const timerId of this.newRowTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.newRowTimers.clear();
  }

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    this.clearMessages();
    const errors: LoadError[] = [];

    try {
      await Promise.all([
        this.runInitialLoad('bandeja diaria', () => this.refreshPage(false), errors),
        this.runInitialLoad('metricas', () => this.refreshMetrics(), errors),
        this.runInitialLoad('asesores', () => this.refreshAdvisors(), errors),
        this.runInitialLoad('campanas', () => this.refreshCampanas(), errors)
      ]);

      if (errors.length) {
        this.errorMessage.set(
          `No se pudo cargar: ${errors.map((error) => `${error.label} (${error.message})`).join(', ')}.`
        );
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitIntake(): Promise<void> {
    if (this.intakeForm.invalid) {
      this.errorMessage.set('Completa prefijo, numero, campana y base.');
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(this.preventaService.registrarIngresoLead(this.intakeForm.getRawValue()));
      this.intakeForm.controls.lead.reset('');
      this.successMessage.set('Lead ingresado. Completa snapshot desde la fila cuando aplique.');
      this.activeDialog.set(null);
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo ingresar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  beginSnapshot(row: LeadGtrResponse): void {
    this.snapshotForm.reset({
      idLead: row.id,
      numeroDocumentoTitularServicio: '',
      direccion: ''
    });
  }

  openNewLead(): void {
    this.activeDialog.set('lead');
  }

  openSnapshot(row: LeadGtrResponse): void {
    this.beginSnapshot(row);
    this.activeDialog.set('snapshot');
  }

  openAssignment(row?: LeadGtrResponse): void {
    this.activeAssignmentLead.set(row ?? null);
    this.activeDialog.set('assign');
  }

  closeDialog(): void {
    this.activeDialog.set(null);
    this.activeAssignmentLead.set(null);
  }

  toggleAdvisorsPanel(): void {
    this.advisorsPanelOpen.update((isOpen) => !isOpen);
  }

  closeAdvisorsPanel(): void {
    this.advisorsPanelOpen.set(false);
  }

  cancelSnapshot(): void {
    this.snapshotForm.reset({
      idLead: 0,
      numeroDocumentoTitularServicio: '',
      direccion: ''
    });
  }

  async saveSnapshot(): Promise<void> {
    const raw = this.snapshotForm.getRawValue();
    const numeroDocumentoTitularServicio = raw.numeroDocumentoTitularServicio.trim();
    const direccion = raw.direccion.trim();

    if (!raw.idLead || (!numeroDocumentoTitularServicio && !direccion)) {
      this.errorMessage.set('Selecciona un lead y completa documento o direccion.');
      return;
    }

    this.isSavingSnapshot.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(
        this.preventaService.actualizarSnapshotsLead(raw.idLead, {
          numeroDocumentoTitularServicio: numeroDocumentoTitularServicio || null,
          direccion: direccion || null
        })
      );
      this.successMessage.set('Snapshot inicial actualizado.');
      this.cancelSnapshot();
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo actualizar el snapshot.'));
    } finally {
      this.isSavingSnapshot.set(false);
    }
  }

  async assignOne(row: LeadGtrResponse): Promise<void> {
    const advisor = this.selectedAdvisor();
    if (!advisor) {
      this.errorMessage.set('Selecciona un asesor.');
      return;
    }

    if (!(await this.ensureAdvisorConnected(advisor))) {
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(
        this.preventaService.asignarLead(row.id, {
          idAsesorAsignado: advisor.empleadoId,
          nombreAsesorAsignado: advisor.nombreCompleto
        })
      );
      this.successMessage.set(`Lead ${row.lead} asignado a ${advisor.nombreCompleto}.`);
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo asignar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async assignSelected(): Promise<void> {
    const advisor = this.selectedAdvisor();
    const idsLead = [...this.selectedIds()];

    if (!advisor || idsLead.length === 0) {
      this.errorMessage.set('Selecciona asesor y al menos un lead.');
      return;
    }

    if (!(await this.ensureAdvisorConnected(advisor))) {
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      const response = await firstValueFrom(
        this.preventaService.asignarLeads({
          idsLead,
          idAsesorAsignado: advisor.empleadoId,
          nombreAsesorAsignado: advisor.nombreCompleto
        })
      );
      this.selectedIds.set(new Set());
      this.successMessage.set(
        `Asignacion masiva: ${response.totalAsignados} asignados, ${response.totalFallidos} fallidos.`
      );
      this.closeDialog();
      await this.reconcile();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo completar la asignacion masiva.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async refreshAdvisors(): Promise<void> {
    let activeUsers: UsuarioResponse[] = [];
    try {
      activeUsers = await firstValueFrom(this.preventaService.listarUsuariosActivosPorRol('ASESOR_VENTAS'));
    } catch (error) {
      this.advisors.set([]);
      throw new Error(this.getErrorMessage(error, 'catalogo de asesores activos'));
    }

    let connectedUsers: ConnectedUserResponse[] = [];
    try {
      connectedUsers = await firstValueFrom(this.presenceService.listarUsuariosConectados('ASESOR_VENTAS'));
    } catch (error) {
      this.advisors.set(this.mapAdvisorOptions(activeUsers, []));
      throw new Error(this.getErrorMessage(error, 'presencia de asesores'));
    }

    let monitorUsers: AsesorGtrPresenceResponse[] = [];
    try {
      monitorUsers = await firstValueFrom(this.presenceService.listarAsesoresConectadosGtr(this.today));
    } catch {
      monitorUsers = [];
    }

    this.advisors.set(this.mapAdvisorOptions(activeUsers, connectedUsers, monitorUsers));
  }

  private mapAdvisorOptions(
    activeUsers: UsuarioResponse[],
    connectedUsers: ConnectedUserResponse[],
    monitorUsers: AsesorGtrPresenceResponse[] = []
  ): AdvisorOption[] {
    const connectedById = new Map(connectedUsers.map((advisor) => [advisor.empleadoId, advisor]));
    const monitorById = new Map(monitorUsers.map((advisor) => [advisor.empleadoId, advisor]));
    return activeUsers
      .map((user: UsuarioResponse) => {
        const presence = connectedById.get(user.empleadoId);
        const monitor = monitorById.get(user.empleadoId);
        return {
          empleadoId: user.empleadoId,
          nombreCompleto: user.nombreCompleto,
          connected: !!presence,
          operativo: monitor?.operativo ?? false,
          estadoSchedule: monitor?.estadoSchedule ?? null,
          esperadoHoy: monitor?.esperadoHoy ?? false,
          disponibilidad: monitor?.disponibilidad ?? presence?.disponibilidad,
          lastSeen: monitor?.lastSeen ?? presence?.lastSeen
        };
      })
      .sort(
        (left, right) =>
          Number(right.operativo) - Number(left.operativo) ||
          Number(right.connected) - Number(left.connected) ||
          left.nombreCompleto.localeCompare(right.nombreCompleto)
      );
  }

  async nextPage(): Promise<void> {
    if (this.pageNumber() + 1 >= this.totalPages()) {
      return;
    }
    this.pageNumber.update((value) => value + 1);
    await this.refreshPage(false);
  }

  async previousPage(): Promise<void> {
    if (this.pageNumber() === 0) {
      return;
    }
    this.pageNumber.update((value) => value - 1);
    await this.refreshPage(false);
  }

  toggleSelection(idLead: number, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(idLead);
    } else {
      next.delete(idLead);
    }
    this.selectedIds.set(next);
  }

  isSelected(idLead: number): boolean {
    return this.selectedIds().has(idLead);
  }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  advisorDotClass(advisor: AdvisorOption): string {
    switch (advisor.disponibilidad) {
      case 'DISPONIBLE':
        return 'dot--available';
      case 'GESTIONANDO':
        return 'dot--working';
      case 'OCUPADO':
        return 'dot--busy';
      case 'SATURADO':
        return 'dot--saturated';
      default:
        return advisor.connected ? 'dot--connected' : 'dot--offline';
    }
  }

  async submitAssignment(): Promise<void> {
    const row = this.activeAssignmentLead();
    if (row) {
      await this.assignOne(row);
      return;
    }

    await this.assignSelected();
  }

  private async ensureAdvisorConnected(advisor: AdvisorOption): Promise<boolean> {
    try {
      const status = await firstValueFrom(this.presenceService.estaConectado(advisor.empleadoId));

      if (status.conectado) {
        return true;
      }

      this.markAdvisorDisconnected(advisor.empleadoId);
      this.errorMessage.set(`${advisor.nombreCompleto} ya no tiene presencia activa. Actualiza y selecciona otro asesor.`);
      void this.refreshAdvisors().catch(() => undefined);
      return false;
    } catch (error) {
      this.markAdvisorDisconnected(advisor.empleadoId);
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo validar la presencia del asesor.'));
      void this.refreshAdvisors().catch(() => undefined);
      return false;
    }
  }

  private markAdvisorDisconnected(empleadoId: number): void {
    this.advisors.update((advisors) =>
      advisors.map((advisor) =>
        advisor.empleadoId === empleadoId
          ? { ...advisor, connected: false, operativo: false, disponibilidad: 'SIN_PRESENCIA', estadoSchedule: 'OFFLINE' }
          : advisor
      )
    );
  }

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads/etapa/PREVENTA').subscribe({
        next: (event) => {
          if (
            [
              'REGISTRO',
              'ASIGNACION',
              'CONTACTO',
              'SNAPSHOTS_ACTUALIZADOS',
              'DATOS_PREVENTA_ACTUALIZADOS',
              'DIRECCION_ACTUALIZADA',
              'TIPIFICACION'
            ].includes(event.tipo)
          ) {
            void this.reconcile();
          }
        },
        error: () => {
          this.errorMessage.set('Realtime no disponible. La bandeja sigue operando por REST.');
        }
      })
    );

    this.realtimeSubscription.add(
      this.attendanceRealtimeService.watchTopic('/topic/asistencia/monitor').subscribe({
        next: () => {
          this.scheduleAttendanceRefresh();
        },
        error: () => undefined
      })
    );
  }

  private startPresencePolling(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef || this.presencePollingId !== null) {
      return;
    }

    this.presencePollingId = windowRef.setInterval(() => {
      if (this.document.visibilityState === 'hidden') {
        return;
      }
      void this.refreshAdvisors().catch(() => undefined);
    }, 30000);
  }

  private stopPresencePolling(): void {
    const windowRef = this.document.defaultView;
    if (windowRef && this.presencePollingId !== null) {
      windowRef.clearInterval(this.presencePollingId);
      this.presencePollingId = null;
    }
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') {
      void this.refreshAdvisors().catch(() => undefined);
    }
  };

  private scheduleAttendanceRefresh(): void {
    if (this.document.visibilityState === 'hidden') {
      return;
    }

    if (this.attendanceRefreshId !== null) {
      return;
    }

    this.attendanceRefreshId = window.setTimeout(() => {
      this.attendanceRefreshId = null;
      void this.refreshAdvisors().catch(() => undefined);
    }, 500);
  }

  private stopAttendanceRefresh(): void {
    if (this.attendanceRefreshId !== null) {
      window.clearTimeout(this.attendanceRefreshId);
      this.attendanceRefreshId = null;
    }
  }

  private async reconcile(): Promise<void> {
    if (this.isReconciling()) {
      return;
    }

    this.isReconciling.set(true);
    try {
      await Promise.all([this.refreshPage(true), this.refreshMetrics(), this.refreshAdvisors()]);
    } finally {
      this.isReconciling.set(false);
    }
  }

  private async refreshPage(silent: boolean): Promise<void> {
    const previous = this.rows();
    const page = await firstValueFrom(this.preventaService.listarBandejaGtr(this.today, this.currentQuery(12)));
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
    this.rows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshMetrics(): Promise<void> {
    this.metrics.set(await firstValueFrom(this.preventaService.obtenerMetricasGtr(this.today)));
  }

  private async refreshCampanas(): Promise<void> {
    this.campanas.set(await firstValueFrom(this.preventaService.listarCampanasActivas()));
  }

  private currentQuery(pageSize: number): PageQuery {
    return {
      pageNumber: pageSize === 100 ? 0 : this.pageNumber(),
      pageSize,
      sortBy: 'lastEntryAt',
      direction: 'desc'
    };
  }

  private mergeVisualRows(
    previous: VisualLeadGtr[],
    incoming: LeadGtrResponse[],
    animateNew: boolean
  ): VisualLeadGtr[] {
    const previousById = new Map(previous.map((row) => [row.id, row]));
    const newIds: number[] = [];
    const rows = incoming.map((row) => {
      const previousRow = previousById.get(row.id);
      const isNew = animateNew && !previousRow;
      if (isNew) {
        newIds.push(row.id);
      }
      return { ...row, isNew: isNew || previousRow?.isNew };
    });
    this.scheduleNewRowReset(newIds);
    return rows;
  }

  private scheduleNewRowReset(ids: number[]): void {
    for (const id of ids) {
      const existingTimer = this.newRowTimers.get(id);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      const timerId = window.setTimeout(() => {
        this.rows.update((rows) => rows.map((row) => (row.id === id ? { ...row, isNew: false } : row)));
        this.newRowTimers.delete(id);
      }, 3500);
      this.newRowTimers.set(id, timerId);
    }
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private async runInitialLoad(
    label: string,
    load: () => Promise<void>,
    errors: LoadError[]
  ): Promise<void> {
    try {
      await load();
    } catch (error) {
      errors.push({
        label,
        message: this.getErrorMessage(error, 'error')
      });
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const responseError = error.error as { message?: string; error?: string } | null;
      const detail = responseError?.message ?? responseError?.error ?? error.statusText;
      return `HTTP ${error.status}${detail ? `: ${detail}` : ''}`;
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
