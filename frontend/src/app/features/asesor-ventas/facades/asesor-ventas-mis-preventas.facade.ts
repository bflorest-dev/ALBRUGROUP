import { Injectable, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AdicionalResponse,
  LeadDetalleResponse,
  MisPreventaResponse,
  MisPreventasResumenResponse,
  PageQuery,
  PlanResponse,
  UbigeoItem
} from '../../../shared/models/preventa/preventa.models';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';

type ActiveDataTab = 'datos' | 'direccion' | 'oferta';
type MisPreventaPeriod = 'hoy' | 'mes';
type ProviderOption = { id: number; nombre: string };
type PlanOption = Partial<PlanResponse> & { id: number; nombre: string };
type PromocionOption = { id: number; reglaComercial: string };
type AdditionalSelection = {
  idAdicional: number;
  nombre: string;
  precioUnitario?: number | null;
  cantidad: number;
};

@Injectable()
export class AsesorVentasMisPreventasFacade {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly preventaService = inject(PreventaLeadService);

  readonly pageSize = 12;
  readonly period = signal<MisPreventaPeriod>('mes');
  readonly periodOptions: { label: string; value: MisPreventaPeriod }[] = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Mes', value: 'mes' }
  ];
  // Mes a consultar cuando el periodo es 'mes' (por defecto el mes actual). Se guarda como el primer
  // dia del mes en fecha LOCAL. Refs estables (signal almacenada / campo) para no romper PrimeNG.
  readonly selectedMonth = signal<Date>(this.firstDayOfCurrentMonth());
  readonly maxMonth = new Date();
  readonly isLoading = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly rows = signal<MisPreventaResponse[]>([]);
  readonly resumen = signal<MisPreventasResumenResponse>({ cerradas: 0, instaladas: 0, rechazadas: 0 });
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageNumber = signal(0);
  readonly conversion = computed(() => {
    const resumen = this.resumen();
    return resumen.cerradas > 0 ? (resumen.instaladas / resumen.cerradas) * 100 : 0;
  });

  readonly detailDialogOpen = signal(false);
  readonly detail = signal<LeadDetalleResponse | null>(null);
  // Campos que muestra el equipo del lead (solo lectura): se ven los visibles del equipo + los que
  // tengan valor. Mantiene esta consulta coherente con lo que vio el asesor al cerrar la venta.
  readonly camposVisibles = computed<ReadonlySet<string>>(
    () => new Set((this.detail()?.camposConfig ?? []).filter((campo) => campo.visible).map((campo) => campo.campo))
  );
  readonly selectedEtapa = signal<string | null>(null);
  readonly activeDataTab = signal<ActiveDataTab>('datos');

  readonly departamentos = signal<UbigeoItem[]>([]);
  readonly provinciasDomicilio = signal<UbigeoItem[]>([]);
  readonly distritosDomicilio = signal<UbigeoItem[]>([]);
  readonly providerOptions = signal<ProviderOption[]>([]);
  readonly selectedProviderId = signal<number | null>(null);
  readonly planOptions = signal<PlanOption[]>([]);
  readonly promocionOptions = signal<PromocionOption[]>([]);
  readonly adicionales = signal<AdicionalResponse[]>([]);
  readonly selectedAdditionals = signal<AdditionalSelection[]>([]);
  readonly additionalsTotal = signal(0);

  readonly tipoDocumentoOptions = ['DNI', 'CE', 'RUC'];
  readonly tipoDomicilioOptions = [
    'HOGAR',
    'MULTIFAMILIAR',
    'CONDOMINIO_EDIFICIO',
    'CONDOMINIO_EDIFICIO_NO_HABILITADO'
  ];
  readonly tipoViaOptions = ['AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'PROLONGACION'];

  // Formularios de solo lectura. Misma estructura que la vista editable para reusar el componente
  // de tabs; se mantienen deshabilitados (patchValue sigue funcionando sobre controles disabled).
  readonly datosForm = this.fb.group({
    tipoDocumento: [''],
    numeroDocumentoTitularServicio: [''],
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

  readonly direccionForm = this.fb.group({
    idDepartamentoDomicilio: [0],
    idProvinciaDomicilio: [0],
    idDistritoDomicilio: [0],
    ubigeoDomicilio: [''],
    tipoDomicilio: [''],
    tipoVia: [''],
    via: [''],
    direccion: [''],
    referencia: [''],
    latitud: [null as number | string | null],
    longitud: [null as number | string | null],
    urbanizacion: [''],
    numero: [''],
    manzana: [''],
    lote: [''],
    nombreEdificio: [''],
    nombreCondominio: [''],
    piso: [''],
    interior: [''],
    plano: ['']
  });

  readonly ofertaForm = this.fb.group({
    idProveedor: [0],
    idPlan: [0],
    idPromocionInterna: [0]
  });

  constructor() {
    this.datosForm.disable();
    this.direccionForm.disable();
    this.ofertaForm.disable();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await Promise.all([this.refreshPage(), this.refreshResumen()]);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar tus preventas.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async changePage(pageNumber: number): Promise<void> {
    if (pageNumber === this.pageNumber()) {
      return;
    }
    this.pageNumber.set(pageNumber);
    this.isLoading.set(true);
    try {
      await this.refreshPage();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar tus preventas.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async setPeriod(value: string | number | undefined): Promise<void> {
    if (value !== 'hoy' && value !== 'mes') {
      return;
    }
    if (value === this.period()) {
      return;
    }
    this.period.set(value);
    this.pageNumber.set(0);
    await this.load();
  }

  /** Elegir otro mes para revisar. Seleccionar un mes implica ver ese mes (cambia el periodo a 'mes'). */
  async setMonth(value: Date | null | undefined): Promise<void> {
    if (!value) {
      return;
    }
    this.selectedMonth.set(new Date(value.getFullYear(), value.getMonth(), 1));
    this.period.set('mes');
    this.pageNumber.set(0);
    await this.load();
  }

  async openDetail(row: MisPreventaResponse): Promise<void> {
    this.detailDialogOpen.set(true);
    this.detail.set(null);
    this.selectedEtapa.set(row.etapaActual ?? null);
    this.activeDataTab.set('datos');
    this.isLoadingDetail.set(true);
    this.errorMessage.set(null);
    try {
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleMiPreventa(row.idLead));
      this.detail.set(detail);
      this.buildDetailView(detail);
    } catch (error) {
      this.detailDialogOpen.set(false);
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo abrir el detalle de la preventa.'));
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  closeDetail(): void {
    this.detailDialogOpen.set(false);
    this.detail.set(null);
  }

  setActiveDataTab(value: string | number | undefined): void {
    if (value === 'datos' || value === 'direccion' || value === 'oferta') {
      this.activeDataTab.set(value);
    }
  }

  etapaLabel(etapa: string | null | undefined): string {
    switch (etapa) {
      case 'PREVENTA':
        return 'PREVENTA';
      case 'VENTA':
        return 'VENTA';
      case 'POSTVENTA':
        return 'POSTVENTA';
      default:
        return etapa ? etapa.toUpperCase() : '-';
    }
  }

  etapaSeverity(etapa: string | null | undefined): 'success' | 'info' | 'warn' | 'secondary' {
    switch (etapa) {
      case 'VENTA':
        return 'success';
      case 'POSTVENTA':
        return 'info';
      case 'PREVENTA':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  leadPhone(row: { prefijo?: string | null; lead?: string | null }): string {
    return `${row.prefijo ?? ''} ${row.lead ?? ''}`.trim();
  }

  leadCountryCode(row: { prefijo?: string | null }): string {
    return row.prefijo === '+51' ? 'PE' : (row.prefijo ?? '').replace(/^\+/, '');
  }

  estadoSeverity(estado: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch ((estado ?? '').toUpperCase()) {
      case 'ACTIVO':
      case 'INGRESADO':
        return 'success';
      case 'PROGRAMADO':
        return 'info';
      case 'SUBSANABLE':
        return 'warn';
      case 'RECHAZADA':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  display(value: string | number | null | undefined): string {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  conversionLabel(): string {
    return `${this.conversion().toFixed(1)}%`;
  }

  private async refreshPage(): Promise<void> {
    const query: PageQuery = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize,
      sortBy: 'fechaPreventa',
      direction: 'desc'
    };
    const { desde, hasta } = this.resolveRange();
    const page = await firstValueFrom(this.preventaService.listarMisPreventas(query, desde, hasta));
    this.rows.set(page.content);
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
  }

  private async refreshResumen(): Promise<void> {
    const { desde, hasta } = this.resolveRange();
    this.resumen.set(await firstValueFrom(this.preventaService.obtenerResumenMisPreventas(desde, hasta)));
  }

  /**
   * Rango cerrado [desde, hasta] en formato YYYY-MM-DD usando la fecha LOCAL del navegador (nunca
   * toISOString, que convierte a UTC y puede cambiar el dia en Peru). A diferencia del selector
   * anterior, el rango tiene tope superior: 'hoy' es solo hoy y 'mes' es exactamente ese mes, para
   * que los conteos no se solapen ni dependan de un limite abierto.
   */
  private resolveRange(): { desde: string; hasta: string } {
    if (this.period() === 'hoy') {
      const hoy = this.toLocalDate(new Date());
      return { desde: hoy, hasta: hoy };
    }
    const month = this.selectedMonth();
    const primerDia = new Date(month.getFullYear(), month.getMonth(), 1);
    const ultimoDia = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return { desde: this.toLocalDate(primerDia), hasta: this.toLocalDate(ultimoDia) };
  }

  private firstDayOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private toLocalDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private buildDetailView(detail: LeadDetalleResponse): void {
    this.datosForm.patchValue({
      tipoDocumento: detail.tipoDocumento ?? '',
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

    // Las opciones de ubigeo se reconstruyen con un unico item desde los nombres ya resueltos por el
    // backend; el id es sintetico (1) y solo sirve para que el select deshabilitado muestre el label.
    this.departamentos.set(detail.departamentoDomicilio ? [{ id: 1, nombre: detail.departamentoDomicilio, codigo: '' }] : []);
    this.provinciasDomicilio.set(detail.provinciaDomicilio ? [{ id: 1, nombre: detail.provinciaDomicilio, codigo: '' }] : []);
    this.distritosDomicilio.set(detail.distritoDomicilio ? [{ id: 1, nombre: detail.distritoDomicilio, codigo: detail.ubigeoDomicilio ?? '' }] : []);

    this.direccionForm.patchValue({
      idDepartamentoDomicilio: detail.departamentoDomicilio ? 1 : 0,
      idProvinciaDomicilio: detail.provinciaDomicilio ? 1 : 0,
      idDistritoDomicilio: detail.distritoDomicilio ? 1 : 0,
      ubigeoDomicilio: detail.ubigeoDomicilio ?? '',
      tipoDomicilio: detail.tipoDomicilio ?? '',
      tipoVia: detail.tipoVia ?? '',
      via: detail.via ?? '',
      direccion: detail.direccion ?? '',
      referencia: detail.referencia ?? '',
      latitud: this.toCoordinateValue(detail.latitud),
      longitud: this.toCoordinateValue(detail.longitud),
      urbanizacion: detail.urbanizacion ?? '',
      numero: detail.numero ?? '',
      manzana: detail.manzana ?? '',
      lote: detail.lote ?? '',
      nombreEdificio: detail.nombreEdificio ?? '',
      nombreCondominio: detail.nombreCondominio ?? '',
      piso: detail.piso ?? '',
      interior: detail.interior ?? ''
    });

    const tieneProveedor = !!detail.idPlan;
    this.providerOptions.set(tieneProveedor ? [{ id: 1, nombre: detail.nombreProveedorPlan ?? 'Proveedor' }] : []);
    this.selectedProviderId.set(tieneProveedor ? 1 : null);
    this.planOptions.set(
      detail.idPlan
        ? [{ id: detail.idPlan, nombre: detail.nombrePlan ?? 'Plan', precio: detail.precioPlan ?? undefined }]
        : [{ id: 0, nombre: 'Sin plan' }]
    );
    this.promocionOptions.set([
      { id: 0, reglaComercial: 'Sin promocion' },
      ...(detail.idPromocionInterna
        ? [{ id: detail.idPromocionInterna, reglaComercial: detail.nombrePromocionInterna ?? 'Promocion' }]
        : [])
    ]);

    const adicionales = detail.adicionales ?? [];
    this.adicionales.set(
      adicionales.map((item) => ({
        id: item.idAdicional ?? 0,
        nombre: item.nombreAdicional ?? 'Adicional',
        precioUnitario: item.precioUnitario ?? undefined
      }))
    );
    this.selectedAdditionals.set(
      adicionales.map((item) => ({
        idAdicional: item.idAdicional ?? 0,
        nombre: item.nombreAdicional ?? 'Adicional',
        precioUnitario: item.precioUnitario ?? undefined,
        cantidad: item.cantidad ?? 0
      }))
    );
    this.additionalsTotal.set(
      detail.precioAdicionales ??
        adicionales.reduce((total, item) => total + (item.precioUnitario ?? 0) * (item.cantidad ?? 0), 0)
    );

    this.ofertaForm.patchValue({
      idProveedor: tieneProveedor ? 1 : 0,
      idPlan: detail.idPlan ?? 0,
      idPromocionInterna: detail.idPromocionInterna ?? 0
    });
  }

  private capitalizeFirst(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  private toCoordinateValue(value: number | string | null | undefined): string {
    return this.stripTrailingCoordinateZeros(String(value ?? '').replace(',', '.').trim());
  }

  private stripTrailingCoordinateZeros(value: string): string {
    if (!value.includes('.')) {
      return value;
    }
    return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: unknown } }).error;
      if (
        typeof responseError === 'object' &&
        responseError !== null &&
        'message' in responseError &&
        typeof responseError.message === 'string' &&
        responseError.message.trim()
      ) {
        return responseError.message;
      }
    }
    return fallback;
  }
}
