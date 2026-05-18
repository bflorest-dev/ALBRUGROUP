import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { SessionService } from '../../../../core/services/session.service';
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
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './asesor-ventas-workspace-page.component.html',
  styleUrl: './asesor-ventas-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsesorVentasWorkspacePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly sessionService = inject(SessionService);
  private readonly preventaService = inject(PreventaLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly realtimeSubscription = new Subscription();
  private readonly newRowTimers = new Map<number, number>();

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
  protected readonly planes = signal<PlanResponse[]>([]);
  protected readonly promociones = signal<PromocionComercialResponse[]>([]);
  protected readonly adicionales = signal<AdicionalResponse[]>([]);

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
    const codigo = this.tipificacionForm.controls.codigoTipificacion.value;
    return this.catalogo()?.tipificaciones.find((tipificacion) => tipificacion.codigo === codigo)?.subtipificaciones ?? [];
  });

  ngOnInit(): void {
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
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la operacion de asesor.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async openDetail(idLead: number): Promise<void> {
    this.selectedLeadId.set(idLead);
    this.clearMessages();
    try {
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleAsesor(idLead));
      this.detail.set(detail);
      this.patchForms(detail);
      await this.refreshOfferCatalogs(detail.idPlan ?? 0);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo abrir el detalle.'));
    }
  }

  protected async registrarContacto(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    await this.saveAction(
      () => this.preventaService.registrarContacto(detail.id),
      'Contacto registrado.',
      () => this.reconcile(detail.id)
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

  protected async tipificar(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.tipificacionForm.invalid) {
      this.errorMessage.set('Selecciona tipificacion y subtipificacion.');
      return;
    }
    const raw = this.tipificacionForm.getRawValue();
    await this.saveAction(
      () =>
        this.preventaService.tipificarLead(detail.id, {
          codigoTipificacion: raw.codigoTipificacion,
          codigoSubtipificacion: raw.codigoSubtipificacion,
          comentario: raw.comentario || null,
          horaProgramada: raw.horaProgramada || null
        }),
      'Lead tipificado.',
      () => this.reconcile(detail.id)
    );
  }

  protected async onPlanChanged(): Promise<void> {
    await this.refreshOfferCatalogs(this.ofertaForm.controls.idPlan.value);
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
      this.patchForms(detail);
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
