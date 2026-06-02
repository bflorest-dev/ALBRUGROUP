import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { AttendanceFacade } from '../../../../core/facades/attendance.facade';
import { AsesorVentasWorkspaceStateService } from '../../../../core/services/asesor-ventas-workspace-state.service';
import { BrowserSessionService } from '../../../../core/services/browser-session.service';
import { OperationalGateService } from '../../../../core/services/operational-gate.service';
import { DisponibilidadOperativa, PresenceService } from '../../../../core/services/presence.service';
import { SessionService } from '../../../../core/services/session.service';
import { EstadoAsistencia } from '../../../../shared/models/schedule/estado-asistencia';
import {
  AdicionalResponse,
  CatalogoResponse,
  LeadAsesorVentasResponse,
  LeadDireccionRequest,
  LeadDetalleResponse,
  LeadOfertaComercialRequest,
  LeadSnapshotsRequest,
  PageQuery,
  PlanResponse,
  PromocionComercialResponse,
  UbigeoItem
} from '../../../../shared/models/preventa/preventa.models';
import { buildTelUrl, buildWhatsAppUrl } from '../../../../shared/utils/phone-link';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import { PreventaLeadService } from '../../../preventa/services/preventa-lead.service';

type VisualLeadAsesor = LeadAsesorVentasResponse & { isNew?: boolean };
type ActiveDataTab = 'datos' | 'direccion' | 'oferta';
type OfertaProviderOption = { id: number; nombre: string };
type OfertaAdditionalSelection = {
  idAdicional: number;
  nombre: string;
  precioUnitario?: number;
  cantidad: number;
};

@Component({
  selector: 'app-asesor-ventas-workspace-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    SelectButtonModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    TagModule,
    TextareaModule,
    TooltipModule
  ],
  templateUrl: './asesor-ventas-workspace-page.component.html',
  styleUrl: './asesor-ventas-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasWorkspacePageComponent implements OnInit, OnDestroy {
  private readonly browserSessionService = inject(BrowserSessionService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly operationalGateService = inject(OperationalGateService);
  private readonly attendanceFacade = inject(AttendanceFacade);
  private readonly presenceService = inject(PresenceService);
  private readonly sessionService = inject(SessionService);
  private readonly workspaceState = inject(AsesorVentasWorkspaceStateService);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();
  private readonly saturationThreshold = 10;
  private initialized = false;
  private initializeInFlight = false;
  private lastAttendanceStatus: EstadoAsistencia | null = null;
  private lastNotificationAt = 0;
  protected readonly operationalGate = this.operationalGateService.createGate('asesor-ventas-workspace');

  protected readonly pageSize = 12;
  protected readonly isLoading = signal(false);
  protected readonly isReconciling = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly warningMessage = signal<string | null>(null);
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
  protected readonly selectedOfertaProviderId = signal<number | null>(null);
  protected readonly selectedOfertaAdditionals = signal<OfertaAdditionalSelection[]>([]);
  protected readonly departamentos = signal<UbigeoItem[]>([]);
  protected readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  protected readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  protected readonly isManagingLead = signal(false);
  protected readonly detailDialogOpen = signal(false);
  protected readonly activeDataTab = signal<ActiveDataTab>('datos');
  protected readonly showComment = signal(false);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
  protected readonly tipoDocumentoOptions = ['DNI', 'CE', 'RUC'];
  protected readonly tipoDomicilioOptions = [
    'HOGAR',
    'MULTIFAMILIAR',
    'CONDOMINIO_EDIFICIO',
    'CONDOMINIO_EDIFICIO_NO_HABILITADO'
  ];
  protected readonly tipoViaOptions = ['AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'PROLONGACION'];

  protected readonly datosForm = this.fb.group({
    tipoDocumento: ['', [Validators.required]],
    numeroDocumentoTitularServicio: ['', [Validators.required]],
    ubigeoNacimiento: [''],
    nombreTitularServicio: [''],
    celularRegistro: [''],
    celularReferencia: [''],
    correo: [''],
    numeroDocumentoTitularCelularRegistro: [''],
    nombreTitularCelularRegistro: ['']
  });

  protected readonly direccionForm = this.fb.group({
    idDepartamentoDomicilio: [0, [Validators.required, Validators.min(1)]],
    idProvinciaDomicilio: [0, [Validators.required, Validators.min(1)]],
    idDistritoDomicilio: [0, [Validators.required, Validators.min(1)]],
    ubigeoDomicilio: ['', [Validators.required]],
    tipoDomicilio: [''],
    tipoVia: [''],
    via: [''],
    direccion: ['', [Validators.required]],
    referencia: [''],
    latitud: [null as number | null, [Validators.required]],
    longitud: [null as number | null, [Validators.required]],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    piso: [''],
    interior: ['']
  });

  protected readonly ofertaForm = this.fb.group({
    idProveedor: [0],
    idPlan: [0],
    idPromocionInterna: [0]
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
  protected readonly ofertaProviderOptions = computed<OfertaProviderOption[]>(() => {
    const providersById = new Map<number, OfertaProviderOption>();
    for (const plan of this.planes()) {
      if (plan.idProveedor) {
        providersById.set(plan.idProveedor, {
          id: plan.idProveedor,
          nombre: plan.nombreProveedor ?? `Proveedor ${plan.idProveedor}`
        });
      }
    }
    return [...providersById.values()].sort((left, right) => left.nombre.localeCompare(right.nombre));
  });
  protected readonly planOptions = computed(() => {
    const idProveedor = this.selectedOfertaProviderId();
    const providerPlans = idProveedor ? this.planes().filter((plan) => plan.idProveedor === idProveedor) : [];
    return [{ id: 0, nombre: 'Sin plan' }, ...providerPlans];
  });
  protected readonly promocionOptions = computed(() => [
    { id: 0, reglaComercial: 'Sin promocion' },
    ...this.promociones()
  ]);
  protected readonly ofertaAdditionalsTotal = computed(() =>
    this.selectedOfertaAdditionals().reduce((total, adicional) => total + (adicional.precioUnitario ?? 0) * adicional.cantidad, 0)
  );
  protected readonly requiresScheduledTime = computed(() => this.selectedTipificacionCode() === 'AGENDADO');
  protected readonly requiresVentaCompleta = computed(() => this.selectedTipificacionCode() === 'PREVENTA_COMPLETA');
  protected readonly hasUnsavedDataChanges = computed(
    () => this.datosForm.dirty || this.direccionForm.dirty || this.ofertaForm.dirty
  );
  protected readonly hasUnsavedModalChanges = computed(() => this.hasUnsavedDataChanges() || this.tipificacionForm.dirty);
  protected readonly canDisplayOperationalData = this.operationalGate.canDisplayOperationalData;
  protected readonly canMutateOperationalData = this.operationalGate.canMutateOperationalData;
  /** El horario termino pero el asesor sigue con un lead en gestion: puede terminarlo (gracia de cierre). */
  protected readonly wrapUpActive = computed(
    () => this.operationalGateService.currentStatus() === 'OFFLINE' && this.isManagingLead()
  );
  /** Permite actuar sobre el lead que se esta gestionando aunque el horario haya terminado. */
  protected readonly canFinishManagedLead = computed(
    () => this.canMutateOperationalData() || this.isManagingLead()
  );


  constructor() {
    effect(() => {
      const status = this.operationalGateService.currentStatus();
      this.totalElements();
      this.isManagingLead();
      void this.syncDisponibilidadOperativa();
      if (status === 'OFFLINE') {
        // Gracia de cierre: si su horario termino pero esta gestionando un lead, NO limpiar la
        // bandeja ni cerrar el modal; debe poder terminar ese lead antes de cerrar su turno.
        if (this.isManagingLead()) {
          this.lastAttendanceStatus = status;
          return;
        }
        this.clearBoardForOffline();
        this.lastAttendanceStatus = status;
        return;
      }
      if (this.operationalGate.canActivateOperationalData() && !this.initialized && !this.initializeInFlight) {
        void this.initialize();
      } else if (this.operationalGate.canActivateOperationalData() && this.lastAttendanceStatus !== 'ONLINE') {
        void this.refreshPage(true).catch(() => undefined);
      }
      this.lastAttendanceStatus = status;
    });

    // Mientras el asesor gestiona un lead, conservar su presencia aunque su horario termine,
    // para que pueda terminarlo antes de cerrar turno (y el GTR no lo marque como abandonador aun).
    effect(() => {
      this.attendanceFacade.setManagingLeadActive(this.isManagingLead());
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
                'GESTION_INICIADA',
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
    if (!this.operationalGate.canActivateOperationalData() || this.initializeInFlight) {
      return;
    }

    this.initializeInFlight = true;
    this.isLoading.set(true);
    this.clearMessages();
    try {
      await Promise.all([this.refreshPage(false), this.refreshCatalogs()]);
      await this.restoreManagingLeadAfterRefresh();
      this.initialized = true;
      this.operationalGate.markActivated();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la operacion de asesor.'));
    } finally {
      this.initializeInFlight = false;
      this.isLoading.set(false);
    }
  }

  protected async openDetail(idLead: number): Promise<void> {
    if (!this.canMutateOperationalData()) {
      this.errorMessage.set('Marca ONLINE para gestionar Leads.');
      return;
    }
    if (this.isManagingLead() && this.selectedLeadId() !== idLead) {
      this.errorMessage.set('Ya tienes un Lead en gestion. Debes tipificarlo antes de abrir otro.');
      return;
    }
    if (this.hasUnsavedModalChanges() && this.selectedLeadId() !== idLead) {
      this.errorMessage.set('Guarda los datos pendientes o limpia los cambios antes de gestionar otro lead.');
      return;
    }
    this.selectedLeadId.set(idLead);
    this.clearMessages();
    this.isSaving.set(true);
    try {
      await firstValueFrom(this.preventaService.iniciarGestionLead(idLead));
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleAsesor(idLead));
      this.detail.set(detail);
      this.patchForms(detail);
      await this.refreshOfferCatalogs(detail.idPlan ?? 0);
      this.detailDialogOpen.set(true);
      this.isManagingLead.set(true);
      this.workspaceState.setManagingLeadState(idLead);
      await this.refreshPage(true);
    } catch (error) {
      this.selectedLeadId.set(null);
      this.workspaceState.clearManagingLeadState();
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo abrir el detalle.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  protected requestCloseDetail(): void {
    if (this.isManagingLead()) {
      this.errorMessage.set('Debes tipificar el Lead antes de cerrar esta gestion.');
      this.detailDialogOpen.set(true);
      return;
    }
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
    this.workspaceState.clearManagingLeadState();
    this.tipificacionForm.reset({
      codigoTipificacion: '',
      codigoSubtipificacion: '',
      comentario: '',
      horaProgramada: ''
    });
    this.selectedTipificacionCode.set('');
    this.showComment.set(false);
    this.activeDataTab.set('datos');
  }

  protected async registrarLlamada(): Promise<void> {
    const detail = this.detail();
    const telUrl = detail ? this.telUrl(detail) : null;
    if (!telUrl) {
      this.errorMessage.set('El lead no tiene un numero valido para iniciar la llamada.');
      return;
    }

    this.browserSessionService.allowExternalNavigation();
    window.location.assign(telUrl);
    await this.registrarContactoOperativo('Llamada registrada.');
  }

  protected async registrarChat(): Promise<void> {
    const detail = this.detail();
    const url = detail ? buildWhatsAppUrl(detail.prefijo, detail.lead) : null;
    if (!url) {
      this.errorMessage.set('El lead no tiene un numero valido para abrir WhatsApp.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
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
        await this.refreshPage(true);
      }
    );
  }

  protected async tipificar(): Promise<void> {
    if (!this.canFinishManagedLead()) {
      this.errorMessage.set('Marca ONLINE para realizar esta accion.');
      return;
    }
    // Si el horario ya termino y esta cerrando su ultimo lead en gestion, al terminar se
    // registra su salida automaticamente (cierre de turno).
    const wasWrapUp = this.wrapUpActive();
    const detail = this.detail();
    if (!detail || this.tipificacionForm.invalid) {
      this.errorMessage.set('Selecciona tipificacion y subtipificacion.');
      return;
    }
    if (this.requiresScheduledTime() && !this.tipificacionForm.controls.horaProgramada.value) {
      this.errorMessage.set('La hora programada es obligatoria para AGENDADO.');
      return;
    }

    if (this.requiresVentaCompleta()) {
      const message = this.getVentaCompletaMissingMessage();
      if (message) {
        this.errorMessage.set(message);
        return;
      }
    }

    this.clearMessages();

    // Capturamos la tipificacion ANTES de guardar: los guardados disparan
    // notificaciones realtime que recargan el detalle y resetean este formulario.
    // Si leyeramos los valores despues, llegarian vacios al backend.
    const raw = this.tipificacionForm.getRawValue();
    const tipificacionPayload = {
      codigoTipificacion: raw.codigoTipificacion,
      codigoSubtipificacion: raw.codigoSubtipificacion,
      comentario: this.showComment() ? raw.comentario || null : null,
      horaProgramada: this.requiresScheduledTime() ? raw.horaProgramada || null : null
    };

    // Al cerrar una venta NO confiamos en el flag "dirty": forzamos el guardado de
    // Datos, Direccion y Oferta para garantizar que el backend tenga la informacion
    // antes de validar la preventa completa. El pre-chequeo ya verifico que esta todo.
    const forceFullSave = this.requiresVentaCompleta();

    if (forceFullSave || this.hasUnsavedDataChanges()) {
      const canProceed = await this.guardarAntesDeTipificar(detail, forceFullSave);
      if (!canProceed) {
        return;
      }
    }

    await this.saveAction(
      () => this.preventaService.tipificarLead(detail.id, tipificacionPayload),
      'Lead tipificado.',
      async () => {
        this.closeDetail();
        if (wasWrapUp) {
          // Termino su lead en gestion fuera de horario: cerrar turno (registrar salida).
          this.attendanceFacade.submitAction('REGISTRAR_SALIDA');
          this.successMessage.set('Lead tipificado. Registramos tu salida y cerramos tu turno.');
        }
        await this.reconcile(detail.id);
      }
    );
  }

  private async guardarAntesDeTipificar(detail: LeadDetalleResponse, forceFullSave = false): Promise<boolean> {
    if (!forceFullSave && this.isSnapshotOnly()) {
      return this.saveSnapshotOnly(detail);
    }

    const tasks: { label: string; action: () => Promise<void>; form: { markAsPristine: () => void } }[] = [];

    if (forceFullSave || this.datosForm.dirty) {
      if (this.datosForm.invalid) {
        this.errorMessage.set('Datos Preventa incompleto: tipo y numero de documento son obligatorios.');
        return false;
      }
      tasks.push({
        label: 'Datos Preventa',
        form: this.datosForm,
        action: () =>
          firstValueFrom(this.preventaService.actualizarDatosPreventa(detail.id, this.cleanObject(this.datosForm.getRawValue())))
      });
    }

    if (forceFullSave || this.direccionForm.dirty) {
      if (this.direccionForm.invalid) {
        this.errorMessage.set(this.getDireccionValidationMessage());
        return false;
      }
      tasks.push({
        label: 'Direccion',
        form: this.direccionForm,
        action: () =>
          firstValueFrom(this.preventaService.actualizarDireccion(detail.id, this.getDireccionRequest()))
      });
    }

    if (forceFullSave || this.ofertaForm.dirty) {
      tasks.push({
        label: 'Oferta Comercial',
        form: this.ofertaForm,
        action: () =>
          firstValueFrom(this.preventaService.actualizarOfertaComercial(detail.id, this.getOfertaRequest()))
      });
    }

    this.isSaving.set(true);
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
    } finally {
      this.isSaving.set(false);
    }

    if (failed.length) {
      const okMsg = saved.length ? `OK: ${saved.join(', ')}. ` : '';
      this.errorMessage.set(`Guardado parcial. ${okMsg}Fallo: ${failed.join(' | ')}. Corrige e intenta tipificar de nuevo.`);
      return false;
    }

    return true;
  }

  /**
   * Detecta si los unicos campos modificados son aquellos que corresponden
   * al endpoint de snapshots (numeroDocumentoTitularServicio y/o direccion),
   * opcionalmente acompanados por tipoDocumento que se ignora en el guardado.
   * Si hay cualquier otro campo del formulario de datos, direccion u oferta
   * modificado, se usa el flujo normal de 3 endpoints.
   */
  private isSnapshotOnly(): boolean {
    const dc = this.datosForm.controls;
    const datosExtrasDirty =
      dc.ubigeoNacimiento.dirty ||
      dc.nombreTitularServicio.dirty ||
      dc.celularRegistro.dirty ||
      dc.celularReferencia.dirty ||
      dc.correo.dirty ||
      dc.numeroDocumentoTitularCelularRegistro.dirty ||
      dc.nombreTitularCelularRegistro.dirty;

    const ic = this.direccionForm.controls;
    const dirExtrasDirty =
      ic.idDepartamentoDomicilio.dirty ||
      ic.idProvinciaDomicilio.dirty ||
      ic.idDistritoDomicilio.dirty ||
      ic.ubigeoDomicilio.dirty ||
      ic.tipoDomicilio.dirty ||
      ic.tipoVia.dirty ||
      ic.via.dirty ||
      ic.referencia.dirty ||
      ic.latitud.dirty ||
      ic.longitud.dirty ||
      ic.urbanizacion.dirty ||
      ic.numero.dirty ||
      ic.manzana.dirty ||
      ic.lote.dirty ||
      ic.nombreEdificio.dirty ||
      ic.nombreCondominio.dirty ||
      ic.piso.dirty ||
      ic.interior.dirty;

    const hasSnapshotChange =
      dc.numeroDocumentoTitularServicio.dirty || ic.direccion.dirty;

    return (
      hasSnapshotChange &&
      !datosExtrasDirty &&
      !dirExtrasDirty &&
      !this.ofertaForm.dirty
    );
  }

  private async saveSnapshotOnly(detail: LeadDetalleResponse): Promise<boolean> {
    const request: LeadSnapshotsRequest = {
      numeroDocumentoTitularServicio:
        this.datosForm.controls.numeroDocumentoTitularServicio.value || null,
      direccion: this.direccionForm.controls.direccion.value || null
    };

    this.isSaving.set(true);
    try {
      await firstValueFrom(this.preventaService.actualizarSnapshotsLead(detail.id, request));
      this.datosForm.markAsPristine();
      this.direccionForm.markAsPristine();
      return true;
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo guardar los datos de gestion.'));
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async onPlanChanged(): Promise<void> {
    const idPlan = this.ofertaForm.controls.idPlan.value;
    this.ofertaForm.controls.idPromocionInterna.setValue(0);
    await this.refreshPlanPromotions(idPlan);
  }

  protected async onOfertaProviderChanged(idProveedor: number): Promise<void> {
    this.selectedOfertaProviderId.set(idProveedor || null);
    this.ofertaForm.patchValue({
      idProveedor: idProveedor || 0,
      idPlan: 0,
      idPromocionInterna: 0
    });
    this.selectedOfertaAdditionals.set([]);
    this.promociones.set([]);
    this.adicionales.set([]);
    this.ofertaForm.markAsDirty();
    if (idProveedor) {
      await this.refreshProviderAdditionals(idProveedor);
    }
  }

  protected adicionalCantidad(idAdicional: number): number {
    return this.selectedOfertaAdditionals().find((item) => item.idAdicional === idAdicional)?.cantidad ?? 0;
  }

  protected incrementarAdicional(adicional: AdicionalResponse): void {
    const current = this.selectedOfertaAdditionals();
    const existing = current.find((item) => item.idAdicional === adicional.id);
    const updated = existing
      ? current.map((item) =>
          item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      : [
          ...current,
          {
            idAdicional: adicional.id,
            nombre: adicional.nombre,
            precioUnitario: adicional.precioUnitario,
            cantidad: 1
          }
        ];
    this.selectedOfertaAdditionals.set(updated);
    this.ofertaForm.markAsDirty();
  }

  protected disminuirAdicional(adicional: AdicionalResponse): void {
    const updated = this.selectedOfertaAdditionals()
      .map((item) => (item.idAdicional === adicional.id ? { ...item, cantidad: item.cantidad - 1 } : item))
      .filter((item) => item.cantidad > 0);
    this.selectedOfertaAdditionals.set(updated);
    this.ofertaForm.markAsDirty();
  }

  protected async onDepartamentoDomicilioChanged(): Promise<void> {
    const idDepartamento = this.direccionForm.controls.idDepartamentoDomicilio.value;
    this.direccionForm.patchValue({
      idProvinciaDomicilio: 0,
      idDistritoDomicilio: 0,
      ubigeoDomicilio: ''
    });
    this.provinciasDomicilio.set([]);
    this.distritosDomicilio.set([]);
    if (idDepartamento > 0) {
      await this.loadProvinciasDomicilio(idDepartamento);
    }
  }

  protected async onProvinciaDomicilioChanged(): Promise<void> {
    const idProvincia = this.direccionForm.controls.idProvinciaDomicilio.value;
    this.direccionForm.patchValue({
      idDistritoDomicilio: 0,
      ubigeoDomicilio: ''
    });
    this.distritosDomicilio.set([]);
    if (idProvincia > 0) {
      await this.loadDistritosDomicilio(idProvincia);
    }
  }

  protected onDistritoDomicilioChanged(): void {
    const idDistrito = this.direccionForm.controls.idDistritoDomicilio.value;
    const distrito = this.distritosDomicilio().find((item) => item.id === idDistrito);
    this.direccionForm.controls.ubigeoDomicilio.setValue(distrito?.codigo ?? '');
    this.direccionForm.controls.ubigeoDomicilio.markAsDirty();
  }

  protected setActiveDataTab(value: string | number | undefined): void {
    if (value === 'datos' || value === 'direccion' || value === 'oferta') {
      this.activeDataTab.set(value);
    }
  }

  protected async limpiarTabActiva(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    this.clearMessages();
    switch (this.activeDataTab()) {
      case 'datos':
        this.patchDatosForm(detail);
        this.datosForm.markAsPristine();
        this.successMessage.set('Cambios de Datos Preventa limpiados.');
        return;
      case 'direccion':
        this.patchDireccionForm(detail);
        this.direccionForm.markAsPristine();
        void this.resolveDomicilioSelection(detail.ubigeoDomicilio ?? null);
        this.successMessage.set('Cambios de Direccion limpiados.');
        return;
      case 'oferta':
        this.patchOfertaForm(detail);
        this.ofertaForm.markAsPristine();
        await this.refreshOfferCatalogs(detail.idPlan ?? 0);
        this.successMessage.set('Cambios de Oferta Comercial limpiados.');
        return;
    }
  }

  protected async changePage(pageNumber: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (pageNumber === this.pageNumber()) {
      return;
    }
    this.pageNumber.set(pageNumber);
    await this.refreshPage(false);
  }

  protected async nextPage(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
    if (this.pageNumber() + 1 >= this.totalPages()) {
      return;
    }
    this.pageNumber.update((value) => value + 1);
    await this.refreshPage(false);
  }

  protected async previousPage(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }
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

  private telUrl(row: Pick<LeadAsesorVentasResponse, 'prefijo' | 'lead'>): string | null {
    return buildTelUrl(row.prefijo, row.lead);
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

  protected isManageActionDisabled(idLead: number): boolean {
    return this.isSaving() || !this.canMutateOperationalData() || (this.isManagingLead() && this.selectedLeadId() !== idLead);
  }

  private async restoreManagingLeadAfterRefresh(): Promise<void> {
    const workspaceSnapshot = this.workspaceState.snapshot();

    if (workspaceSnapshot.isManagingLead && workspaceSnapshot.activeLeadId) {
      const restored = await this.reopenManagedLead(
        workspaceSnapshot.activeLeadId,
        'Se restauro tu lead en gestion para que continues donde quedaste.'
      );

      if (restored) {
        return;
      }
    }

    const managingRows = this.rows().filter((row) => row.estadoSeguimiento === 'EN_GESTION');
    if (!managingRows.length) {
      this.workspaceState.clearManagingLeadState();
      return;
    }

    const candidate = this.pickManagingLeadCandidate(managingRows);
    if (!candidate) {
      this.workspaceState.clearManagingLeadState();
      return;
    }

    const restored = await this.reopenManagedLead(candidate.id);
    if (!restored) {
      this.workspaceState.clearManagingLeadState();
      return;
    }

    if (managingRows.length > 1) {
      this.warningMessage.set('Se detectaron varias gestiones abiertas. Se reabrio la mas reciente para que continues.');
      return;
    }

    this.successMessage.set('Se restauro tu lead en gestion para que continues donde quedaste.');
  }

  private pickManagingLeadCandidate(rows: LeadAsesorVentasResponse[]): LeadAsesorVentasResponse | null {
    if (!rows.length) {
      return null;
    }

    return [...rows].sort((left, right) => this.leadRowSortTimestamp(right) - this.leadRowSortTimestamp(left))[0] ?? null;
  }

  private leadRowSortTimestamp(row: LeadAsesorVentasResponse): number {
    const lastEntryAt =
      'lastEntryAt' in row && typeof row.lastEntryAt === 'string' && row.lastEntryAt
        ? new Date(row.lastEntryAt).getTime()
        : Number.NaN;

    if (Number.isFinite(lastEntryAt)) {
      return lastEntryAt;
    }

    const fechaAsignacion = row.fechaAsignacion ? new Date(row.fechaAsignacion).getTime() : Number.NaN;
    if (Number.isFinite(fechaAsignacion)) {
      return fechaAsignacion;
    }

    return row.id;
  }

  private async reopenManagedLead(idLead: number, restoredMessage?: string): Promise<boolean> {
    try {
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleAsesor(idLead));
      if (detail.estadoSeguimiento !== 'EN_GESTION') {
        return false;
      }

      this.selectedLeadId.set(idLead);
      this.detail.set(detail);
      this.patchForms(detail);
      await this.refreshOfferCatalogs(detail.idPlan ?? 0);
      this.detailDialogOpen.set(true);
      this.isManagingLead.set(true);
      this.workspaceState.setManagingLeadState(idLead);

      if (restoredMessage) {
        this.successMessage.set(restoredMessage);
      }

      return true;
    } catch {
      return false;
    }
  }

  private async reconcile(changedLeadId?: number): Promise<void> {
    if (this.isReconciling() || !this.canDisplayOperationalData()) {
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
      if (!this.hasUnsavedModalChanges()) {
        this.patchForms(detail);
      }
    } catch {
      // Un fallo de sincronizacion en segundo plano (p. ej. red intermitente) NO debe
      // cerrar el modal ni borrar el trabajo del asesor. Si tiene cambios sin guardar,
      // conservamos detalle y formularios tal cual y solo avisamos; sigue donde estaba.
      if (this.hasUnsavedModalChanges()) {
        this.errorMessage.set(
          'No pudimos sincronizar este lead en segundo plano. Tus datos siguen aqui; continua y guarda normalmente.'
        );
        return;
      }
      this.detail.set(null);
      this.selectedLeadId.set(null);
      this.isManagingLead.set(false);
      this.detailDialogOpen.set(false);
      this.workspaceState.clearManagingLeadState();
    }
  }

  private async refreshPage(silent: boolean): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }

    const previous = this.rows();
    const page = await firstValueFrom(this.preventaService.listarBandejaAsesorVentas(this.currentQuery()));
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
    this.workspaceState.setAssignedLeadCount(page.totalElements);
    this.rows.set(this.mergeVisualRows(previous, page.content, silent));
  }

  private async refreshCatalogs(): Promise<void> {
    const [catalogo, planes, departamentos] = await Promise.all([
      firstValueFrom(this.preventaService.getCatalogoTipificaciones('PREVENTA')),
      firstValueFrom(this.preventaService.listarPlanes(undefined, true)),
      firstValueFrom(this.preventaService.listarDepartamentos())
    ]);
    this.catalogo.set(catalogo);
    this.planes.set(planes);
    this.departamentos.set(departamentos);
  }

  private async refreshOfferCatalogs(idPlan: number): Promise<void> {
    const plan = this.planes().find((item) => item.id === idPlan);
    const idProveedor = plan?.idProveedor ?? null;
    this.selectedOfertaProviderId.set(idProveedor);
    this.ofertaForm.controls.idProveedor.setValue(idProveedor ?? 0);
    const [promociones, adicionales] = await Promise.all([
      firstValueFrom(this.preventaService.listarPromociones(idPlan ? { idPlan } : {})),
      idProveedor ? firstValueFrom(this.preventaService.listarAdicionales(idProveedor)) : Promise.resolve([])
    ]);
    this.promociones.set(promociones);
    this.adicionales.set(adicionales);
  }

  private async refreshPlanPromotions(idPlan: number): Promise<void> {
    const idProveedor = this.selectedOfertaProviderId() ?? undefined;
    this.promociones.set(
      await firstValueFrom(this.preventaService.listarPromociones({
        idProveedor,
        ...(idPlan ? { idPlan } : {})
      }))
    );
  }

  private async refreshProviderAdditionals(idProveedor: number): Promise<void> {
    this.adicionales.set(await firstValueFrom(this.preventaService.listarAdicionales(idProveedor)));
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
    this.patchDatosForm(detail);
    this.patchDireccionForm(detail);
    this.patchOfertaForm(detail);
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

  private patchDatosForm(detail: LeadDetalleResponse): void {
    this.datosForm.patchValue({
      tipoDocumento: detail.tipoDocumento ?? '',
      numeroDocumentoTitularServicio: detail.numeroDocumentoTitularServicio ?? '',
      ubigeoNacimiento: detail.ubigeoNacimiento ?? '',
      nombreTitularServicio: detail.nombreTitular ?? '',
      celularRegistro: detail.celularRegistro ?? '',
      celularReferencia: detail.celularReferencia ?? '',
      correo: detail.correo ?? '',
      numeroDocumentoTitularCelularRegistro: detail.numeroDocumentoTitularCelularRegistro ?? '',
      nombreTitularCelularRegistro: detail.nombreTitularCelularRegistro ?? ''
    });
  }

  private patchDireccionForm(detail: LeadDetalleResponse): void {
    this.direccionForm.patchValue({
      idDepartamentoDomicilio: 0,
      idProvinciaDomicilio: 0,
      idDistritoDomicilio: 0,
      ubigeoDomicilio: detail.ubigeoDomicilio ?? '',
      tipoDomicilio: detail.tipoDomicilio ?? '',
      tipoVia: detail.tipoVia ?? '',
      via: detail.via ?? '',
      direccion: detail.direccion ?? '',
      referencia: detail.referencia ?? '',
      latitud: detail.latitud ?? null,
      longitud: detail.longitud ?? null,
      urbanizacion: detail.urbanizacion ?? '',
      numero: detail.numero ?? '',
      manzana: detail.manzana ?? '',
      lote: detail.lote ?? '',
      nombreEdificio: detail.nombreEdificio ?? '',
      nombreCondominio: detail.nombreCondominio ?? '',
      piso: detail.piso ?? '',
      interior: detail.interior ?? ''
    });
    void this.resolveDomicilioSelection(detail.ubigeoDomicilio ?? null);
  }

  private patchOfertaForm(detail: LeadDetalleResponse): void {
    const idPlan = detail.idPlan ?? 0;
    const idProveedor = this.planes().find((plan) => plan.id === idPlan)?.idProveedor ?? null;
    this.selectedOfertaProviderId.set(idProveedor);
    this.selectedOfertaAdditionals.set([]);
    this.ofertaForm.patchValue({
      idProveedor: idProveedor ?? 0,
      idPlan,
      idPromocionInterna: detail.idPromocionInterna ?? 0
    });
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
    if (!this.canFinishManagedLead()) {
      this.errorMessage.set('Marca ONLINE para realizar esta accion.');
      return;
    }

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
    const status = this.operationalGateService.currentStatus();

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

  /** Elimina caracteres no numericos y limita la longitud del control de formulario. */
  /** Maxima cantidad de digitos del documento del titular del servicio segun su tipo. */
  protected documentoServicioMaxLength(): number {
    switch (this.datosForm.controls.tipoDocumento.value) {
      case 'DNI': return 8;
      case 'RUC': return 11;
      case 'CE': return 12;
      default: return 12;
    }
  }

  /** Al cambiar el tipo de documento, recorta el numero al nuevo limite. */
  protected onTipoDocumentoChanged(): void {
    const control = this.datosForm.controls.numeroDocumentoTitularServicio;
    this.setNumericDigits(control, control.value, this.documentoServicioMaxLength());
  }

  protected setNumericDigits(control: AbstractControl | null, value: string, maxLength: number): void {
    if (!control) return;
    const normalized = value.replace(/\D/g, '').slice(0, maxLength);
    if (control.value !== normalized) {
      control.setValue(normalized);
    }
  }

  private cleanObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, entryValue === '' ? null : entryValue])) as T;
  }

  private getOfertaRequest(): LeadOfertaComercialRequest {
    const raw = this.ofertaForm.getRawValue();
    const adicionales = this.selectedOfertaAdditionals()
      .filter((item) => item.cantidad > 0)
      .map((item) => ({
        idAdicional: item.idAdicional,
        cantidad: item.cantidad
      }));

    return {
      idPlan: raw.idPlan || null,
      idPromocionInterna: raw.idPromocionInterna || null,
      adicionales: adicionales.length ? adicionales : null
    };
  }

  private getDireccionRequest(): LeadDireccionRequest {
    const raw = this.direccionForm.getRawValue();
    return this.cleanObject({
      ubigeoDomicilio: raw.ubigeoDomicilio,
      tipoDomicilio: raw.tipoDomicilio,
      tipoVia: raw.tipoVia,
      via: raw.via,
      direccion: raw.direccion,
      referencia: raw.referencia,
      latitud: raw.latitud as number,
      longitud: raw.longitud as number,
      urbanizacion: raw.urbanizacion,
      numero: raw.numero,
      manzana: raw.manzana,
      lote: raw.lote,
      nombreEdificio: raw.nombreEdificio,
      nombreCondominio: raw.nombreCondominio,
      piso: raw.piso,
      interior: raw.interior
    });
  }

  /**
   * Refleja la validacion del backend para cerrar una venta (PREVENTA_COMPLETA).
   * Revisa de una sola vez todos los campos obligatorios, los agrupa por pestana
   * en lenguaje de usuario y navega a la primera pestana con datos faltantes.
   * Devuelve el mensaje a mostrar, o null si todo esta completo.
   */
  private getVentaCompletaMissingMessage(): string | null {
    const blank = (value: string | null | undefined): boolean => !value || !value.trim();
    const d = this.datosForm.controls;
    const a = this.direccionForm.controls;

    const faltantes: { tab: ActiveDataTab; campo: string }[] = [];

    if (blank(d.tipoDocumento.value)) faltantes.push({ tab: 'datos', campo: 'Documento' });
    if (blank(d.numeroDocumentoTitularServicio.value)) faltantes.push({ tab: 'datos', campo: 'Numero de Documento' });
    if (blank(d.nombreTitularServicio.value)) faltantes.push({ tab: 'datos', campo: 'Titular del Servicio' });
    if (blank(d.celularRegistro.value)) faltantes.push({ tab: 'datos', campo: 'Celular a registrar' });
    if (blank(d.correo.value)) faltantes.push({ tab: 'datos', campo: 'Correo' });
    if (blank(d.numeroDocumentoTitularCelularRegistro.value)) faltantes.push({ tab: 'datos', campo: 'Numero de Documento del Titular del Celular' });
    if (blank(d.nombreTitularCelularRegistro.value)) faltantes.push({ tab: 'datos', campo: 'Nombre del Titular del Celular' });

    if (blank(a.ubigeoDomicilio.value)) faltantes.push({ tab: 'direccion', campo: 'Distrito' });
    if (blank(a.tipoDomicilio.value)) faltantes.push({ tab: 'direccion', campo: 'Tipo de Domicilio' });
    if (blank(a.tipoVia.value)) faltantes.push({ tab: 'direccion', campo: 'Tipo de Via' });
    if (blank(a.via.value)) faltantes.push({ tab: 'direccion', campo: 'Nombre de la Via' });
    if (blank(a.direccion.value)) faltantes.push({ tab: 'direccion', campo: 'Direccion' });
    if (blank(a.referencia.value)) faltantes.push({ tab: 'direccion', campo: 'Referencia' });
    if (blank(a.piso.value)) faltantes.push({ tab: 'direccion', campo: 'Piso' });
    if (blank(a.interior.value)) faltantes.push({ tab: 'direccion', campo: 'Interior' });

    if (!this.ofertaForm.controls.idPlan.value) faltantes.push({ tab: 'oferta', campo: 'Plan' });

    if (!faltantes.length) {
      return null;
    }

    const tabsOrdenadas: { tab: ActiveDataTab; titulo: string }[] = [
      { tab: 'datos', titulo: 'Datos' },
      { tab: 'direccion', titulo: 'Direccion' },
      { tab: 'oferta', titulo: 'Oferta comercial' }
    ];

    const grupos = tabsOrdenadas
      .map(({ tab, titulo }) => {
        const campos = faltantes.filter((item) => item.tab === tab).map((item) => item.campo);
        return campos.length ? `${titulo}: ${campos.join(', ')}` : null;
      })
      .filter((grupo): grupo is string => grupo !== null);

    this.activeDataTab.set(faltantes[0].tab);

    return `Para cerrar la venta, completa estos datos. ${grupos.join('. ')}.`;
  }

  private getDireccionValidationMessage(): string {
    const missing: string[] = [];
    if (this.direccionForm.controls.idDepartamentoDomicilio.invalid) {
      missing.push('departamento');
    }
    if (this.direccionForm.controls.idProvinciaDomicilio.invalid) {
      missing.push('provincia');
    }
    if (this.direccionForm.controls.idDistritoDomicilio.invalid) {
      missing.push('distrito');
    }
    if (this.direccionForm.controls.direccion.invalid) {
      missing.push('direccion');
    }
    if (this.direccionForm.controls.latitud.invalid) {
      missing.push('latitud');
    }
    if (this.direccionForm.controls.longitud.invalid) {
      missing.push('longitud');
    }
    return missing.length ? `Direccion incompleta. Revisa: ${missing.join(', ')}.` : 'Direccion incompleta.';
  }

  private async resolveDomicilioSelection(ubigeoDomicilio: string | null): Promise<void> {
    if (!ubigeoDomicilio) {
      this.provinciasDomicilio.set([]);
      this.distritosDomicilio.set([]);
      this.direccionForm.patchValue({
        idDepartamentoDomicilio: 0,
        idProvinciaDomicilio: 0,
        idDistritoDomicilio: 0
      });
      this.direccionForm.markAsPristine();
      return;
    }

    try {
      const departamentos = this.departamentos().length
        ? this.departamentos()
        : await firstValueFrom(this.preventaService.listarDepartamentos());
      if (!this.departamentos().length) {
        this.departamentos.set(departamentos);
      }

      for (const departamento of departamentos) {
        const provincias = await firstValueFrom(this.preventaService.listarProvincias(departamento.id));
        for (const provincia of provincias) {
          const distritos = await firstValueFrom(this.preventaService.listarDistritos(provincia.id));
          const distrito = distritos.find((item) => item.codigo === ubigeoDomicilio);
          if (distrito) {
            this.provinciasDomicilio.set(provincias);
            this.distritosDomicilio.set(distritos);
            this.direccionForm.patchValue({
              idDepartamentoDomicilio: departamento.id,
              idProvinciaDomicilio: provincia.id,
              idDistritoDomicilio: distrito.id,
              ubigeoDomicilio
            });
            this.direccionForm.markAsPristine();
            return;
          }
        }
      }
    } catch {
      this.provinciasDomicilio.set([]);
      this.distritosDomicilio.set([]);
    }
  }

  private async loadProvinciasDomicilio(idDepartamento: number): Promise<void> {
    try {
      this.provinciasDomicilio.set(await firstValueFrom(this.preventaService.listarProvincias(idDepartamento)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las provincias.'));
    }
  }

  private async loadDistritosDomicilio(idProvincia: number): Promise<void> {
    try {
      this.distritosDomicilio.set(await firstValueFrom(this.preventaService.listarDistritos(idProvincia)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los distritos.'));
    }
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.warningMessage.set(null);
    this.errorMessage.set(null);
  }

  private clearBoardForOffline(): void {
    this.initialized = false;
    this.rows.set([]);
    this.detail.set(null);
    this.selectedLeadId.set(null);
    this.totalElements.set(0);
    this.totalPages.set(0);
    this.pageNumber.set(0);
    this.isLoading.set(false);
    this.isReconciling.set(false);
    this.isSaving.set(false);
    this.detailDialogOpen.set(false);
    this.isManagingLead.set(false);
    this.workspaceState.clear();
    this.operationalGate.clearActivation();
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: unknown; details?: unknown } }).error;
      if (
        typeof responseError === 'object' &&
        responseError !== null &&
        'message' in responseError &&
        typeof responseError.message === 'string' &&
        responseError.message.trim()
      ) {
        const details = 'details' in responseError ? responseError.details : null;
        if (Array.isArray(details) && details.length) {
          return `${responseError.message}: ${details.map((item) => String(item)).join(', ')}`;
        }
        return responseError.message;
      }
    }
    return fallback;
  }
}
