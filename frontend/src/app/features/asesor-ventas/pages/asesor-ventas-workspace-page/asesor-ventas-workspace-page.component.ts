import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { AttendanceFacade } from '../../../../core/facades/attendance.facade';
import { DisponibilidadOperativa, PresenceService } from '../../../../core/services/presence.service';
import { SessionService } from '../../../../core/services/session.service';
import { EstadoAsistencia } from '../../../../shared/models/schedule/estado-asistencia';
import {
  AdicionalResponse,
  CatalogoResponse,
  LeadAsesorVentasResponse,
  LeadDetalleResponse,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse
} from '../../../../shared/models/preventa/preventa.models';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../../preventa/services/preventa-lead.service';

type VisualLeadAsesor = LeadAsesorVentasResponse & { isNew?: boolean };

@Component({
  selector: 'app-asesor-ventas-workspace-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './asesor-ventas-workspace-page.component.html',
  styleUrl: './asesor-ventas-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasWorkspacePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly attendanceFacade = inject(AttendanceFacade);
  private readonly presenceService = inject(PresenceService);
  private readonly sessionService = inject(SessionService);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private readonly saturationThreshold = 10;
  private initialized = false;
  private lastNotificationAt = 0;

  protected readonly pageSize = 12;
  protected readonly isLoading = signal(false);
  protected readonly isReconciling = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly rows = signal<VisualLeadAsesor[]>([]);
  protected readonly detail = signal<LeadDetalleResponse | null>(null);
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly pageNumber = signal(0);
  protected readonly catalogo = signal<CatalogoResponse | null>(null);
  protected readonly selectedTipificacionCode = signal('');
  protected readonly planes = signal<PlanResponse[]>([]);
  protected readonly promociones = signal<PromocionComercialResponse[]>([]);
  protected readonly adicionales = signal<AdicionalResponse[]>([]);
  protected readonly isManagingLead = signal(false);
  protected readonly detailDialogOpen = signal(false);
  protected readonly activeDataTab = signal('datos');
  protected readonly showComment = signal(false);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly tipoDocumentoOptions = ['DNI', 'CE', 'PASAPORTE'];
  protected readonly tipoDomicilioOptions = ['CASA', 'DEPARTAMENTO', 'NEGOCIO'];
  protected readonly tipoViaOptions = ['CALLE', 'AVENIDA', 'JIRON'];

  protected readonly datosForm = this.fb.group({
    tipoDocumento: ['DNI', [Validators.required]],
    numeroDocumentoTitularServicio: ['', [Validators.required]],
    ubigeoNacimiento: [''],
    nombreTitularServicio: [''],
    celularRegistro: [''],
    celularReferencia: [''],
    correo: [''],
    nombreMadre: [''],
    nombrePadre: [''],
    numeroDocumentoTitularCelularRegistro: [''],
    nombreTitularCelularRegistro: ['']
  });

  protected readonly direccionForm = this.fb.group({
    ubigeoDomicilio: ['', [Validators.required]],
    tipoDomicilio: ['CASA'],
    tipoVia: ['CALLE'],
    via: [''],
    direccion: ['', [Validators.required]],
    referencia: [''],
    latitud: [-12.0464, [Validators.required]],
    longitud: [-77.0428, [Validators.required]],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    plano: [''],
    piso: [''],
    interior: ['']
  });

  protected readonly ofertaForm = this.fb.group({
    idPlan: [0],
    idPromocionInterna: [0],
    adicionales: ['']
  });

  protected readonly tipificacionForm = this.fb.group({
    codigoTipificacion: ['', [Validators.required]],
    codigoSubtipificacion: ['', [Validators.required]],
    comentario: [''],
    horaProgramada: ['']
  });

  protected readonly subtipificaciones = computed(() => {
    const codigo = this.selectedTipificacionCode();
    const subtipificaciones =
      this.catalogo()?.tipificaciones.find((tipificacion) => tipificacion.codigo === codigo)?.subtipificaciones ?? [];

    return [...subtipificaciones].sort((left, right) => left.orden - right.orden);
  });
  protected readonly tipificaciones = computed(() => {
    return [...(this.catalogo()?.tipificaciones ?? [])].sort((left, right) => left.orden - right.orden);
  });
  protected readonly planOptions = computed(() => [{ id: 0, nombre: 'Sin plan' }, ...this.planes()]);
  protected readonly promocionOptions = computed(() => [
    { id: 0, reglaComercial: 'Sin promocion' },
    ...this.promociones()
  ]);
  protected readonly requiresScheduledTime = computed(() => this.selectedTipificacionCode() === 'AGENDADO');
  protected readonly hasUnsavedDataChanges = computed(
    () => this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty
  );

  constructor() {
    effect(() => {
      this.attendanceFacade.currentStatus();
      this.totalElements();
      this.isManagingLead();
      void this.syncDisponibilidadOperativa();
    });
  }

  ngOnInit(): void {
    this.realtimeSubscription.add(
      this.tipificacionForm.controls.codigoTipificacion.valueChanges.subscribe((codigo) => {
        this.selectedTipificacionCode.set(codigo);
        this.tipificacionForm.controls.codigoSubtipificacion.setValue('');
        if (codigo !== 'AGENDADO') {
          this.tipificacionForm.controls.horaProgramada.setValue('');
        }
      })
    );

    void this.initialize();
    const empleadoId = this.sessionService.getSession()?.empleadoId;
    if (empleadoId) {
      this.realtimeSubscription.add(
        this.realtimeService.watchTopic(`/topic/leads/asesor/${empleadoId}`).subscribe({
          next: (event) => {
            if (
              [
                'ASIGNACION',
                'CONTACTO',
                'DATOS_PREVENTA_ACTUALIZADOS',
                'DIRECCION_ACTUALIZADA',
                'OFERTA_COMERCIAL_ACTUALIZADA',
                'TIPIFICACION'
              ].includes(event.tipo)
            ) {
              void this.reconcile(event.idLead);
            }
          },
          error: () => {
            this.errorMessage.set('Realtime no disponible. La bandeja sigue operando por REST.');
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
    for (const timerId of this.newRowTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.newRowTimers.clear();
  }

  protected async initialize(): Promise<void> {
    this.isLoading.set(true);
    this.clearMessages();
    try {
      await Promise.all([this.refreshPage(false), this.refreshCatalogs()]);
      this.initialized = true;
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la operacion de asesor.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async openDetail(idLead: number): Promise<void> {
    if (this.hasUnsavedDataChanges() && this.selectedLeadId() !== idLead) {
      this.errorMessage.set('Guarda los datos pendientes o limpia los cambios antes de gestionar otro lead.');
      return;
    }
    this.selectedLeadId.set(idLead);
    this.clearMessages();
    try {
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleAsesor(idLead));
      this.detail.set(detail);
      this.patchForms(detail);
      await this.refreshOfferCatalogs(detail.idPlan ?? 0);
      this.detailDialogOpen.set(true);
      this.isManagingLead.set(true);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo abrir el detalle.'));
    }
  }

  protected requestCloseDetail(): void {
    if (this.hasUnsavedDataChanges()) {
      this.errorMessage.set('Hay datos sin guardar. Guarda los cambios o limpia lo ultimo ingresado antes de cerrar.');
      this.detailDialogOpen.set(true);
      return;
    }
    this.closeDetail();
  }

  private closeDetail(): void {
    this.detailDialogOpen.set(false);
    this.detail.set(null);
    this.selectedLeadId.set(null);
    this.isManagingLead.set(false);
    this.showComment.set(false);
  }

  protected async registrarLlamada(): Promise<void> {
    await this.registrarContactoOperativo('Llamada registrada.');
  }

  protected async registrarChat(): Promise<void> {
    await this.registrarContactoOperativo('Chat registrado.');
  }

  private async registrarContactoOperativo(successMessage: string): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    await this.saveAction(
      () => this.preventaService.registrarContacto(detail.id),
      successMessage,
      async () => {
        this.isManagingLead.set(true);
        await this.reconcile(detail.id);
      }
    );
  }

  protected async guardarDatos(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.datosForm.invalid) {
      this.errorMessage.set('Completa tipo y documento del titular.');
      return;
    }
    await this.saveAction(
      () => this.preventaService.actualizarDatosPreventa(detail.id, this.cleanObject(this.datosForm.getRawValue())),
      'Datos de preventa actualizados.',
      () => this.reconcile(detail.id)
    );
  }

  protected async guardarDireccion(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.direccionForm.invalid) {
      this.errorMessage.set('Completa ubigeo, direccion y coordenadas.');
      return;
    }
    await this.saveAction(
      () => this.preventaService.actualizarDireccion(detail.id, this.cleanObject(this.direccionForm.getRawValue())),
      'Direccion actualizada.',
      () => this.reconcile(detail.id)
    );
  }

  protected async guardarOferta(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    const raw = this.ofertaForm.getRawValue();
    await this.saveAction(
      () =>
        this.preventaService.actualizarOfertaComercial(detail.id, {
          idPlan: raw.idPlan || null,
          idPromocionInterna: raw.idPromocionInterna || null,
          adicionales: this.parseAdditionals(raw.adicionales)
        }),
      'Oferta comercial actualizada.',
      () => this.reconcile(detail.id)
    );
  }

  protected async guardarCambiosLead(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const tasks: { label: string; action: () => Promise<void>; form: { markAsPristine: () => void } }[] = [];

    if (this.datosForm.dirty) {
      if (this.datosForm.invalid) {
        this.errorMessage.set('Datos Preventa esta incompleto: tipo y numero documento son obligatorios.');
        return;
      }
      tasks.push({
        label: 'Datos Preventa',
        form: this.datosForm,
        action: () =>
          firstValueFrom(
            this.preventaService.actualizarDatosPreventa(detail.id, this.cleanObject(this.datosForm.getRawValue()))
          )
      });
    }

    if (this.direccionForm.dirty) {
      if (this.direccionForm.invalid) {
        this.errorMessage.set('Direccion esta incompleta: ubigeo, direccion, latitud y longitud son obligatorios.');
        return;
      }
      tasks.push({
        label: 'Direccion',
        form: this.direccionForm,
        action: () =>
          firstValueFrom(
            this.preventaService.actualizarDireccion(detail.id, this.cleanObject(this.direccionForm.getRawValue()))
          )
      });
    }

    if (this.ofertaForm.dirty) {
      const raw = this.ofertaForm.getRawValue();
      tasks.push({
        label: 'Oferta Comercial',
        form: this.ofertaForm,
        action: () =>
          firstValueFrom(
            this.preventaService.actualizarOfertaComercial(detail.id, {
              idPlan: raw.idPlan || null,
              idPromocionInterna: raw.idPromocionInterna || null,
              adicionales: this.parseAdditionals(raw.adicionales)
            })
          )
      });
    }

    if (!tasks.length) {
      this.successMessage.set('No hay cambios pendientes por guardar.');
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();
    const saved: string[] = [];
    const failed: string[] = [];
    try {
      for (const task of tasks) {
        try {
          await task.action();
          task.form.markAsPristine();
          saved.push(task.label);
        } catch (error) {
          failed.push(`${task.label}: ${this.getErrorMessage(error, 'No se pudo guardar')}`);
        }
      }

      if (failed.length) {
        this.errorMessage.set(`Guardado parcial. OK: ${saved.join(', ') || 'ninguno'}. Fallo: ${failed.join(' | ')}`);
        return;
      }

      this.successMessage.set(`Guardado: ${saved.join(', ')}.`);
      await this.reconcile(detail.id);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async tipificar(): Promise<void> {
    if (this.hasUnsavedDataChanges()) {
      this.errorMessage.set('Hay datos sin guardar. Guarda los cambios o limpia lo ultimo ingresado antes de tipificar.');
      return;
    }
    const detail = this.detail();
    if (!detail || this.tipificacionForm.invalid) {
      this.errorMessage.set('Selecciona tipificacion y subtipificacion.');
      return;
    }
    if (this.requiresScheduledTime() && !this.tipificacionForm.controls.horaProgramada.value) {
      this.errorMessage.set('La hora programada es obligatoria para AGENDADO.');
      return;
    }
    const raw = this.tipificacionForm.getRawValue();
    await this.saveAction(
      () =>
        this.preventaService.tipificarLead(detail.id, {
          codigoTipificacion: raw.codigoTipificacion,
          codigoSubtipificacion: raw.codigoSubtipificacion,
          comentario: this.showComment() ? raw.comentario || null : null,
          horaProgramada: this.requiresScheduledTime() ? raw.horaProgramada || null : null
        }),
      'Lead tipificado.',
      async () => {
        this.closeDetail();
        await this.reconcile(detail.id);
      }
    );
  }

  protected async onPlanChanged(): Promise<void> {
    await this.refreshOfferCatalogs(this.ofertaForm.controls.idPlan.value);
  }

  protected async changePage(pageNumber: number): Promise<void> {
    if (pageNumber === this.pageNumber()) {
      return;
    }
    this.pageNumber.set(pageNumber);
    await this.refreshPage(false);
  }

  protected async nextPage(): Promise<void> {
    if (this.pageNumber() + 1 >= this.totalPages()) {
      return;
    }
    this.pageNumber.update((value) => value + 1);
    await this.refreshPage(false);
  }

  protected async previousPage(): Promise<void> {
    if (this.pageNumber() === 0) {
      return;
    }
    this.pageNumber.update((value) => value - 1);
    await this.refreshPage(false);
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  protected leadPhone(row: LeadAsesorVentasResponse | LeadDetalleResponse): string {
    return `${row.prefijo} ${row.lead}`.trim();
  }

  protected estadoSeverity(estado: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (estado === 'GESTIONADO') {
      return 'success';
    }
    if (estado === 'EN_GESTION') {
      return 'warn';
    }
    if (estado === 'AGENDADO') {
      return 'info';
    }
    if (estado === 'NUEVO') {
      return 'secondary';
    }
    return 'info';
  }

  protected toggleComment(): void {
    this.showComment.update((value) => !value);
  }

  private async reconcile(changedLeadId?: number): Promise<void> {
    if (this.isReconciling()) {
      return;
    }

    this.isReconciling.set(true);
    try {
      await this.refreshPage(true);
      if (changedLeadId && this.selectedLeadId() === changedLeadId) {
        await this.refreshOpenDetail(changedLeadId);
      }
    } finally {
      this.isReconciling.set(false);
    }
  }

  private async refreshOpenDetail(idLead: number): Promise<void> {
    try {
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleAsesor(idLead));
      this.detail.set(detail);
      if (!this.hasUnsavedDataChanges()) {
        this.patchForms(detail);
      }
    } catch {
      this.detail.set(null);
      this.selectedLeadId.set(null);
    }
  }

  private async refreshPage(silent: boolean): Promise<void> {
    const previous = this.rows();
    const page = await firstValueFrom(this.preventaService.listarBandejaAsesorVentas(this.currentQuery()));
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
    this.rows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshCatalogs(): Promise<void> {
    const [catalogo, planes] = await Promise.all([
      firstValueFrom(this.preventaService.getCatalogoTipificaciones('PREVENTA')),
      firstValueFrom(this.preventaService.listarPlanes(undefined, true))
    ]);
    this.catalogo.set(catalogo);
    this.planes.set(planes);
  }

  private async refreshOfferCatalogs(idPlan: number): Promise<void> {
    const plan = this.planes().find((item) => item.id === idPlan);
    const idProveedor = plan?.idProveedor;
    const [promociones, adicionales] = await Promise.all([
      firstValueFrom(this.preventaService.listarPromociones(idPlan ? { idPlan } : {})),
      idProveedor ? firstValueFrom(this.preventaService.listarAdicionales(idProveedor)) : Promise.resolve([])
    ]);
    this.promociones.set(promociones);
    this.adicionales.set(adicionales);
  }

  private currentQuery(): PageQuery {
    return {
      pageNumber: this.pageNumber(),
      pageSize: 12,
      sortBy: 'lastEntryAt',
      direction: 'desc'
    };
  }

  private patchForms(detail: LeadDetalleResponse): void {
    this.datosForm.patchValue({
      tipoDocumento: detail.tipoDocumento ?? 'DNI',
      numeroDocumentoTitularServicio: detail.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: detail.ubigeoNacimiento ?? '',
      nombreTitularServicio: detail.nombreTitular ?? '',
      celularRegistro: detail.celularRegistro ?? '',
      celularReferencia: detail.celularReferencia ?? '',
      correo: detail.correo ?? '',
      nombreMadre: detail.nombreMadre ?? '',
      nombrePadre: detail.nombrePadre ?? '',
      numeroDocumentoTitularCelularRegistro: detail.numeroDocumentoTitularCelularRegistro ?? '',
      nombreTitularCelularRegistro: detail.nombreTitularCelularRegistro ?? ''
    });
    this.direccionForm.patchValue({
      ubigeoDomicilio: detail.ubigeoDomicilio ?? '',
      tipoDomicilio: detail.tipoDomicilio ?? 'CASA',
      tipoVia: detail.tipoVia ?? 'CALLE',
      via: detail.via ?? '',
      direccion: detail.direccion ?? '',
      referencia: detail.referencia ?? '',
      latitud: detail.latitud ?? -12.0464,
      longitud: detail.longitud ?? -77.0428,
      urbanizacion: detail.urbanizacion ?? '',
      numero: detail.numero ?? '',
      manzana: detail.manzana ?? '',
      lote: detail.lote ?? '',
      nombreEdificio: detail.nombreEdificio ?? '',
      nombreCondominio: detail.nombreCondominio ?? '',
      plano: detail.plano ?? '',
      piso: detail.piso ?? '',
      interior: detail.interior ?? ''
    });
    this.ofertaForm.patchValue({
      idPlan: detail.idPlan ?? 0,
      idPromocionInterna: detail.idPromocionInterna ?? 0,
      adicionales: ''
    });
    this.tipificacionForm.reset({
      codigoTipificacion: '',
      codigoSubtipificacion: '',
      comentario: '',
      horaProgramada: ''
    });
    this.selectedTipificacionCode.set('');
    this.showComment.set(false);
    this.activeDataTab.set('datos');
    this.markFormsPristine();
  }

  private mergeVisualRows(previous: VisualLeadAsesor[], incoming: LeadAsesorVentasResponse[], animateNew: boolean): VisualLeadAsesor[] {
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
    if (animateNew && this.initialized && newIds.length) {
      this.playAssignmentSound();
    }
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

  private markFormsPristine(): void {
    this.datosForm.markAsPristine();
    this.direccionForm.markAsPristine();
    this.ofertaForm.markAsPristine();
    this.tipificacionForm.markAsPristine();
  }

  private playAssignmentSound(): void {
    const now = Date.now();
    if (now - this.lastNotificationAt < 1200) {
      return;
    }
    this.lastNotificationAt = now;

    try {
      const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) {
        return;
      }
      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.16);
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
      oscillator.onended = () => void context.close();
    } catch {
      // Algunos navegadores bloquean audio si el usuario aun no interactuo con la pagina.
    }
  }

  private async saveAction(action: () => import('rxjs').Observable<void>, successMessage: string, afterSuccess: () => Promise<void>): Promise<void> {
    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(action());
      this.successMessage.set(successMessage);
      await afterSuccess();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo completar la operacion.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  private async syncDisponibilidadOperativa(): Promise<void> {
    const disponibilidad = this.resolveDisponibilidadOperativa();
    if (!disponibilidad) {
      return;
    }

    try {
      await this.presenceService.actualizarDisponibilidad(disponibilidad);
    } catch {
      // La presencia puede no estar lista durante el arranque o haber expirado entre heartbeats.
    }
  }

  private resolveDisponibilidadOperativa(): DisponibilidadOperativa | null {
    const status = this.attendanceFacade.currentStatus();

    if (status === 'OFFLINE') {
      return null;
    }

    if (this.isBusyAttendanceStatus(status)) {
      return 'OCUPADO';
    }

    if (this.totalElements() >= this.saturationThreshold) {
      return 'SATURADO';
    }

    if (this.isManagingLead()) {
      return 'GESTIONANDO';
    }

    return 'DISPONIBLE';
  }

  private isBusyAttendanceStatus(status: EstadoAsistencia): boolean {
    return status === 'ALMUERZO' || status === 'SERVICIOS' || status === 'CAPACITACION';
  }

  private parseAdditionals(value: string): { idAdicional: number; cantidad: number }[] | null {
    const additionals = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [idAdicional, cantidad = '1'] = item.split(':');
        return {
          idAdicional: Number(idAdicional),
          cantidad: Number(cantidad)
        };
      })
      .filter((item) => Number.isFinite(item.idAdicional) && item.idAdicional > 0 && Number.isFinite(item.cantidad) && item.cantidad > 0);

    return additionals.length ? additionals : null;
  }

  private cleanObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, entryValue === '' ? null : entryValue])) as T;
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }
}
