import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SessionService } from '../../../core/services/session.service';
import { LeadRealtimeService } from '../../preventa/services/lead-realtime.service';
import {
  CatalogoResponse,
  EventoResponse,
  LeadDetalleResponse,
  SubtipificacionResponse,
  TipificacionResponse
} from '../../../shared/models/preventa/preventa.models';
import {
  CredencialPlataformaResponse,
  EncuestaPostventaRequest,
  EncuestaPostventaResponse,
  EntregaCredencialPlataformaRequest,
  EntregaCredencialPlataformaResponse,
  CerrarPeriodoFacturacionRequest,
  LeadPostventaBandejaResponse,
  LeadTipificacionPostventaRequest,
  PagoPostventaRequest,
  PagoPostventaResponse,
  PaquetePlataformaResponse,
  PeriodoFacturacionFacturaRequest,
  PeriodoFacturacionPostventaResponse,
  PlataformaDigitalResponse,
  PostventaAsignacionConflictDetails,
  PostventaLeadService,
  SatisfaccionPostventaResponse
} from '../services/postventa-lead.service';
import { VisualLeadPostventa, splitNombreDosLineas } from '../models/postventa.vm';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error';
const ESTADOS_PERIODO_CERRADO = ['PAGO_CONFIRMADO', 'BAJA', 'ANULADO'];

/**
 * Facade del workspace de POSTVENTA. Unica puerta funcional del feature: mantiene el estado
 * reactivo (bandeja + contexto de gestion) y orquesta las llamadas al servicio. La pagina lo
 * provee y los sub-componentes (board, drawer y paneles) lo comparten por DI.
 */
@Injectable()
export class PostventaWorkspaceFacade {
  private readonly service = inject(PostventaLeadService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly realtime = inject(LeadRealtimeService);
  private readonly session = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = 12;

  // Realtime: eventos que justifican refrescar la bandeja (un lead entra/sale de POSTVENTA,
  // se toma/libera o se tipifica). Ej.: BACKOFFICE tipifica "instalado" -> el lead aparece solo.
  private static readonly REALTIME_RELEVANTE = new Set(['ASIGNACION', 'CONTACTO', 'TIPIFICACION']);
  private readonly _reconciling = signal(false);
  private realtimeIniciado = false;

  // --- Bandeja ---
  private readonly _rows = signal<VisualLeadPostventa[]>([]);
  private readonly _totalRows = signal(0);
  private readonly _pageNumber = signal(0);
  private readonly _loadingBoard = signal(false);
  readonly rows = this._rows.asReadonly();
  readonly totalRows = this._totalRows.asReadonly();
  readonly pageNumber = this._pageNumber.asReadonly();
  readonly loadingBoard = this._loadingBoard.asReadonly();

  // --- Gestion (drawer) ---
  private readonly _drawerOpen = signal(false);
  private readonly _selectedLead = signal<VisualLeadPostventa | null>(null);
  private readonly _loadingContext = signal(false);
  private readonly _saving = signal(false);
  // Marca si el asesor guardo algun cambio operativo en esta gestion: si es asi, no puede cerrar el
  // drawer sin tipificar (la tipificacion cierra la gestion y libera el lead).
  private readonly _gestionModificada = signal(false);
  readonly drawerOpen = this._drawerOpen.asReadonly();
  readonly selectedLead = this._selectedLead.asReadonly();
  readonly loadingContext = this._loadingContext.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly gestionModificada = this._gestionModificada.asReadonly();

  // --- Contexto del lead abierto ---
  private readonly _detail = signal<LeadDetalleResponse | null>(null);
  private readonly _eventos = signal<EventoResponse[]>([]);
  private readonly _catalogo = signal<CatalogoResponse | null>(null);
  private readonly _entregas = signal<EntregaCredencialPlataformaResponse[]>([]);
  private readonly _periodos = signal<PeriodoFacturacionPostventaResponse[]>([]);
  private readonly _encuestas = signal<EncuestaPostventaResponse[]>([]);
  private readonly _resumenEncuestas = signal<SatisfaccionPostventaResponse | null>(null);
  private readonly _pagos = signal<PagoPostventaResponse[]>([]);
  private readonly _plataformas = signal<PlataformaDigitalResponse[]>([]);
  private readonly _paquetes = signal<PaquetePlataformaResponse[]>([]);
  private readonly _credenciales = signal<CredencialPlataformaResponse[]>([]);
  private readonly _marcas = signal<PlataformaDigitalResponse[]>([]);
  readonly detail = this._detail.asReadonly();
  readonly eventos = this._eventos.asReadonly();
  readonly entregas = this._entregas.asReadonly();
  readonly periodos = this._periodos.asReadonly();
  readonly encuestas = this._encuestas.asReadonly();
  readonly resumenEncuestas = this._resumenEncuestas.asReadonly();
  readonly pagos = this._pagos.asReadonly();
  readonly plataformas = this._plataformas.asReadonly();
  readonly paquetes = this._paquetes.asReadonly();
  readonly credenciales = this._credenciales.asReadonly();
  readonly marcas = this._marcas.asReadonly();

  // Periodo elegido en la tab Facturacion. Por defecto el vigente; permite navegar el historico.
  private readonly _selectedPeriodoId = signal<number | null>(null);

  // --- Derivados ---
  readonly activePeriodo = computed<PeriodoFacturacionPostventaResponse | null>(() => {
    const abiertos = this._periodos().filter(
      (periodo) => !ESTADOS_PERIODO_CERRADO.includes(String(periodo.estado ?? ''))
    );
    return abiertos[0] ?? this._periodos()[0] ?? null;
  });
  readonly selectedPeriodo = computed<PeriodoFacturacionPostventaResponse | null>(() => {
    const id = this._selectedPeriodoId();
    return this._periodos().find((periodo) => periodo.id === id) ?? this.activePeriodo();
  });
  // Un periodo cerrado (pagado, baja o anulado) es solo lectura.
  readonly selectedPeriodoCerrado = computed(() =>
    ESTADOS_PERIODO_CERRADO.includes(String(this.selectedPeriodo()?.estado ?? ''))
  );
  // Pagos del periodo seleccionado (los del backend vienen por lead).
  readonly pagosDelPeriodo = computed<PagoPostventaResponse[]>(() => {
    const periodoId = this.selectedPeriodo()?.id;
    if (!periodoId) {
      return this._pagos();
    }
    return this._pagos().filter((pago) => pago.idPeriodoFacturacion === periodoId);
  });
  readonly tipificaciones = computed<TipificacionResponse[]>(() =>
    [...(this._catalogo()?.tipificaciones ?? [])].sort((a, b) => a.orden - b.orden)
  );
  readonly tienePlataformaOfrecida = computed(() => Boolean(this._selectedLead()?.idPlataformaDigitalOfrecida));

  subtipificacionesDe(codigoTipificacion: string): SubtipificacionResponse[] {
    const tipificacion = this.tipificaciones().find((t) => t.codigo === codigoTipificacion);
    return [...(tipificacion?.subtipificaciones ?? [])].sort((a, b) => a.orden - b.orden);
  }

  selectPeriodo(idPeriodo: number | null): void {
    this._selectedPeriodoId.set(idPeriodo);
  }

  private readonly today = this.todayLocalDate();

  // ---------------------------------------------------------------------------
  // Bandeja
  // ---------------------------------------------------------------------------
  async loadBoard(pageNumber = this._pageNumber(), silent = false): Promise<void> {
    if (!silent && this._loadingBoard()) {
      return;
    }
    if (!silent) {
      this._loadingBoard.set(true);
    }
    try {
      const page = await firstValueFrom(
        this.service.listarBandeja({
          pageNumber,
          pageSize: this.pageSize,
          sortBy: 'fechaInstalacion',
          direction: 'desc'
        })
      );
      this._pageNumber.set(page.page);
      this._totalRows.set(page.totalElements);
      this._rows.set(page.content.map((row) => this.withFechaGroup(row)));
    } catch (error) {
      // En refrescos silenciosos (realtime) no molestamos con un toast: stompjs reintenta solo.
      if (!silent) {
        this.notify('error', this.errorMessage(error, 'No se pudo cargar la bandeja de Postventa.'));
      }
    } finally {
      if (!silent) {
        this._loadingBoard.set(false);
      }
    }
  }

  /**
   * Suscribe la bandeja al realtime de leads para que se actualice sola cuando un lead entra o sale
   * de POSTVENTA (p. ej. BACKOFFICE tipifica "instalado"), se toma/libera o se tipifica. Idempotente.
   */
  startRealtime(): void {
    if (this.realtimeIniciado) {
      return;
    }
    this.realtimeIniciado = true;

    this.realtime
      .watchTopic('/topic/leads/etapa/POSTVENTA')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (PostventaWorkspaceFacade.REALTIME_RELEVANTE.has(event.tipo)) {
            void this.reconcile();
          }
        },
        error: () => undefined
      });

    const empleadoId = this.session.getSession()?.empleadoId;
    if (empleadoId) {
      this.realtime
        .watchTopic(`/topic/leads/asesor/${empleadoId}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (event) => {
            if (PostventaWorkspaceFacade.REALTIME_RELEVANTE.has(event.tipo)) {
              void this.reconcile();
            }
          },
          error: () => undefined
        });
    }
  }

  private async reconcile(): Promise<void> {
    if (this._reconciling()) {
      return;
    }
    this._reconciling.set(true);
    try {
      await this.loadBoard(this._pageNumber(), true);
    } finally {
      this._reconciling.set(false);
    }
  }

  async changePage(pageNumber: number): Promise<void> {
    if (pageNumber === this._pageNumber()) {
      return;
    }
    await this.loadBoard(pageNumber);
  }

  // ---------------------------------------------------------------------------
  // Abrir gestion (tomar con relevo) y cerrar
  // ---------------------------------------------------------------------------
  async gestionar(row: VisualLeadPostventa, confirmarReasignacion = false): Promise<void> {
    if (this._saving()) {
      return;
    }
    this._saving.set(true);
    try {
      await firstValueFrom(this.service.tomarLead(row.idLead, { confirmarReasignacion }));
      await this.openDrawer(row);
    } catch (error) {
      if (!this.pedirConfirmacionRelevo(error, row)) {
        this.notify('error', this.errorMessage(error, 'No se pudo abrir la gestion del lead.'));
        await this.loadBoard();
      }
    } finally {
      this._saving.set(false);
    }
  }

  private pedirConfirmacionRelevo(error: unknown, row: VisualLeadPostventa): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
      return false;
    }
    const details = (error.error as { details?: PostventaAsignacionConflictDetails } | null)?.details;
    const requiere =
      Boolean(details?.requiereConfirmarReasignacion) ||
      Boolean(details?.requiereConfirmarLeadEnGestion) ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA' ||
      details?.tipo === 'LEAD_EN_GESTION';
    if (!requiere) {
      return false;
    }
    const asesor = details?.nombreAsesorActual || 'otro asesor de Postventa';
    this.confirmationService.confirm({
      header: 'Lead en gestion',
      message: `${asesor} tiene este lead en gestion ahora mismo. Si continuas, pasara a la tuya.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, continuar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => void this.gestionar(row, true)
    });
    return true;
  }

  private async openDrawer(row: VisualLeadPostventa): Promise<void> {
    this._selectedLead.set(row);
    this._drawerOpen.set(true);
    this.resetContext();
    await this.loadContext(row);
  }

  // Cierre solicitado por el usuario (mask, icono X o boton): si hubo cambios sin tipificar, se
  // bloquea el cierre y se pide tipificar; si no, cierra normal.
  requestCloseDrawer(): void {
    if (this._gestionModificada()) {
      this.notify('warn', 'Registraste cambios en esta gestion. Tipificala para poder cerrarla.');
      return;
    }
    this.closeDrawer();
  }

  closeDrawer(): void {
    this._drawerOpen.set(false);
    this._selectedLead.set(null);
    this.resetContext();
  }

  private async reloadOpenLead(): Promise<void> {
    const row = this._selectedLead();
    if (!row) {
      return;
    }
    await this.loadContext(row, true);
    await this.loadBoard(this._pageNumber());
  }

  private async loadContext(row: VisualLeadPostventa, silent = false): Promise<void> {
    if (!silent) {
      this._loadingContext.set(true);
    }
    try {
      const [detail, eventos, catalogo, plataformas, marcas, entregas, periodos, encuestas, resumen, pagos] = await Promise.all([
        firstValueFrom(this.service.obtenerDetalle(row.idLead)),
        firstValueFrom(this.service.listarEventos(row.idLead, this.recentPage())),
        firstValueFrom(this.service.getCatalogoTipificaciones(row.idLead)),
        firstValueFrom(this.service.listarPlataformasDigitales()),
        firstValueFrom(this.service.listarMarcasDispositivo()),
        firstValueFrom(this.service.listarEntregas(row.idLead)),
        firstValueFrom(this.service.listarPeriodos(row.idLead)),
        firstValueFrom(this.service.listarEncuestas(row.idLead, this.recentPage())),
        firstValueFrom(this.service.obtenerResumenEncuestas(row.idLead)),
        firstValueFrom(this.service.listarPagos(row.idLead, this.recentPage()))
      ]);
      this._detail.set(detail);
      this._eventos.set(eventos.content);
      this._catalogo.set(catalogo);
      this._plataformas.set(plataformas);
      this._marcas.set(marcas);
      this._entregas.set(entregas);
      this._periodos.set(periodos);
      this._encuestas.set(encuestas.content);
      this._resumenEncuestas.set(resumen);
      this._pagos.set(pagos.content);
      this._selectedPeriodoId.set(this.activePeriodo()?.id ?? null);
    } catch (error) {
      this.notify('error', this.errorMessage(error, 'No se pudo cargar la gestion del lead.'));
    } finally {
      this._loadingContext.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Plataforma digital
  // ---------------------------------------------------------------------------
  async onPlataformaChanged(idPlataforma: number | null): Promise<void> {
    this._paquetes.set([]);
    this._credenciales.set([]);
    if (!idPlataforma) {
      return;
    }
    try {
      this._paquetes.set(await firstValueFrom(this.service.listarPaquetesPlataforma(idPlataforma)));
    } catch (error) {
      this.notify('error', this.errorMessage(error, 'No se pudieron cargar los paquetes.'));
    }
  }

  async onPaqueteChanged(idPaquete: number | null): Promise<void> {
    this._credenciales.set([]);
    if (!idPaquete) {
      return;
    }
    try {
      this._credenciales.set(await firstValueFrom(this.service.listarCredencialesPlataformaDisponibles(idPaquete)));
    } catch (error) {
      this.notify('error', this.errorMessage(error, 'No se pudieron cargar las credenciales.'));
    }
  }

  async entregarCredencial(request: EntregaCredencialPlataformaRequest): Promise<boolean> {
    const lead = this._selectedLead();
    if (!lead) {
      return false;
    }
    return this.run(
      () => this.service.entregarCredencial(lead.idLead, request),
      'Credencial entregada.',
      'No se pudo entregar la credencial.'
    );
  }

  // ---------------------------------------------------------------------------
  // Encuesta
  // ---------------------------------------------------------------------------
  async registrarEncuesta(request: EncuestaPostventaRequest): Promise<boolean> {
    const lead = this._selectedLead();
    if (!lead) {
      return false;
    }
    return this.run(
      () => this.service.registrarEncuesta(lead.idLead, { ...request, idPeriodoFacturacion: this.activePeriodo()?.id ?? null }),
      'Encuesta registrada.',
      'No se pudo registrar la encuesta.'
    );
  }

  // ---------------------------------------------------------------------------
  // Facturacion
  // ---------------------------------------------------------------------------
  async confirmarFactura(request: PeriodoFacturacionFacturaRequest): Promise<boolean> {
    const periodo = this.selectedPeriodo();
    if (!periodo) {
      this.notify('warn', 'No hay periodo de facturacion seleccionado.');
      return false;
    }
    return this.run(
      () => this.service.confirmarFactura(periodo.id, request),
      'Factura actualizada.',
      'No se pudo actualizar la factura.'
    );
  }

  async registrarPago(request: Omit<PagoPostventaRequest, 'idPeriodoFacturacion'>): Promise<boolean> {
    const lead = this._selectedLead();
    const periodo = this.selectedPeriodo();
    if (!lead || !periodo) {
      this.notify('warn', 'No hay periodo de facturacion seleccionado.');
      return false;
    }
    return this.run(
      () => this.service.registrarPago(lead.idLead, { ...request, idPeriodoFacturacion: periodo.id }),
      'Pago registrado.',
      'No se pudo registrar el pago.'
    );
  }

  async cerrarPeriodo(request: CerrarPeriodoFacturacionRequest): Promise<boolean> {
    const periodo = this.selectedPeriodo();
    if (!periodo) {
      return false;
    }
    return this.run(
      () => this.service.cerrarPeriodo(periodo.id, request),
      'Periodo cerrado.',
      'No se pudo cerrar el periodo.'
    );
  }

  // ---------------------------------------------------------------------------
  // Tipificacion (cierra la gestion y libera el lead)
  // ---------------------------------------------------------------------------
  async tipificar(request: LeadTipificacionPostventaRequest): Promise<void> {
    const lead = this._selectedLead();
    if (!lead || this._saving()) {
      return;
    }
    this._saving.set(true);
    try {
      await firstValueFrom(this.service.registrarContacto(lead.idLead));
      await firstValueFrom(this.service.tipificarLead(lead.idLead, request));
      this.notify('success', 'Gestion tipificada.');
      this.closeDrawer();
      await this.loadBoard(this._pageNumber());
    } catch (error) {
      this.notify('error', this.errorMessage(error, 'No se pudo tipificar la gestion.'));
    } finally {
      this._saving.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Utilidades internas
  // ---------------------------------------------------------------------------
  private async run(
    action: () => Observable<unknown>,
    okMessage: string,
    failMessage: string
  ): Promise<boolean> {
    this._saving.set(true);
    try {
      await firstValueFrom(action());
      this._gestionModificada.set(true);
      this.notify('success', okMessage);
      await this.reloadOpenLead();
      return true;
    } catch (error) {
      this.notify('error', this.errorMessage(error, failMessage));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  private resetContext(): void {
    this._detail.set(null);
    this._eventos.set([]);
    this._catalogo.set(null);
    this._entregas.set([]);
    this._periodos.set([]);
    this._encuestas.set([]);
    this._resumenEncuestas.set(null);
    this._pagos.set([]);
    this._paquetes.set([]);
    this._credenciales.set([]);
    this._selectedPeriodoId.set(null);
    this._gestionModificada.set(false);
  }

  private recentPage() {
    return { pageNumber: 0, pageSize: 20, sortBy: 'createdAt', direction: 'desc' as const };
  }

  private withFechaGroup(row: LeadPostventaBandejaResponse): VisualLeadPostventa {
    const key = this.fechaGroupKey(row.fechaInstalacion);
    const cliente = splitNombreDosLineas(row.nombreCliente);
    return {
      ...row,
      fechaGroupKey: key,
      fechaGroupLabel: this.fechaGroupLabel(key),
      fechaGroupSortKey: this.fechaGroupSortKey(key),
      clienteLinea1: cliente.linea1,
      clienteLinea2: cliente.linea2
    };
  }

  private fechaGroupKey(date?: string | null): string {
    if (!date) {
      return 'SIN_FECHA';
    }
    const localDate = date.slice(0, 10);
    return localDate === this.today ? 'HOY' : localDate.slice(0, 7);
  }

  private fechaGroupLabel(key: string): string {
    if (key === 'HOY') {
      return 'Hoy';
    }
    if (key === 'SIN_FECHA') {
      return 'Sin fecha de instalacion';
    }
    const [year, month] = key.split('-').map(Number);
    if (!year || !month) {
      return key;
    }
    const label = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private fechaGroupSortKey(key: string): string {
    if (key === 'HOY') {
      return '000-HOY';
    }
    if (key === 'SIN_FECHA') {
      return '999-SIN_FECHA';
    }
    return `100-${key}`;
  }

  private todayLocalDate(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private notify(severity: ToastSeverity, detail: string): void {
    this.messageService.add({ severity, summary: severity === 'error' ? 'Error' : 'Postventa', detail });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const message = (error.error as { message?: string; detail?: string } | null)?.message
        ?? (error.error as { detail?: string } | null)?.detail
        ?? error.message;
      return message || fallback;
    }
    return fallback;
  }
}
