import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  LeadDatosPreventaRequest,
  LeadDetalleResponse,
  LeadTipificacionRequest
} from '../../../shared/models/preventa/preventa.models';
import { buildTelUrl, buildWhatsAppUrl } from '../../../shared/utils/phone-link';
import { formatApiErrorMessage } from '../../../shared/utils/api-error.utils';
import { PreventaLeadService } from '../../preventa/services/preventa-lead.service';
import { AsesorVentasWorkspaceFacade } from '../../asesor-ventas/facades/asesor-ventas-workspace.facade';
import { SupervisorGtrOperativoFacade } from './supervisor-gtr-operativo.facade';

/**
 * Adaptador del Drawer V2 para SUPERVISOR_GTR.
 *
 * Hereda únicamente la presentación y el estado de formularios del dominio PREVENTA; todas las
 * operaciones que mutan datos usan las rutas supervisor, por lo que abrir el drawer nunca toma el
 * lead ni lo asigna al usuario actual.
 */
@Injectable()
export class SupervisorGtrGestionFacade extends AsesorVentasWorkspaceFacade {
  private readonly supervisorService = inject(PreventaLeadService);
  private readonly supervisorPage = inject(SupervisorGtrOperativoFacade);
  private readonly destroyRef = inject(DestroyRef);

  /** El Supervisor puede operar desde esta bandeja sin depender del estado ONLINE del asesor. */
  override readonly canMutateOperationalData = signal(true);
  override readonly allowsNewOpportunity = false;
  /** El listado abre primero una captura rápida; el drawer completo es una segunda decisión. */
  readonly quickDialogOpen = signal(false);

  override phoneNumbersUrl(idLead: number): string {
    return `${API_CONSTANTS.gatewayBaseUrl}/leads/preventa/supervisor/${idLead}/numeros-llamada`;
  }

  override phoneNumberUpdateUrl(idLead: number): string {
    return `${API_CONSTANTS.gatewayBaseUrl}/leads/preventa/supervisor/${idLead}/numero-para-llamar`;
  }

  constructor() {
    super();

    this.tipificacionForm.controls.codigoTipificacion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((codigo) => {
        this.selectedTipificacionCode.set(codigo);
        this.tipificacionForm.controls.codigoSubtipificacion.setValue('');
      });
    this.tipificacionForm.controls.codigoSubtipificacion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((codigo) => {
        this.selectedSubtipificacionCode.set(codigo ?? '');
        if (!this.requiresScheduledTime()) {
          this.tipificacionForm.controls.horaProgramada.setValue('');
        }
      });
    this.identidadForm.controls.prefijo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((prefijo) => this.updateSupervisorIdentityValidation(prefijo));
  }

  /** Evita que el efecto del facade de asesor intente inicializar la bandeja equivocada. */
  override async initialize(): Promise<void> {
    return Promise.resolve();
  }

  override async openDetail(idLead: number): Promise<void> {
    if ((this.quickDialogOpen() || this.detailDialogOpen()) && this.detail()?.id !== idLead) {
      this.errorMessage.set('Guarda o cierra la gestión actual antes de abrir otro lead.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const detail = await firstValueFrom(this.supervisorService.obtenerDetalleGestionSupervisorGtr(idLead));
      this.detail.set(detail);
      this.patchForms(detail);
      await this.refreshOfferCatalogs(detail.idPlan ?? 0, this.resolveProveedorOfertaInicial(detail));
      await this.cargarCatalogoDelLead(idLead, this.selectedOfertaProviderId());
      this.selectedLeadId.set(idLead);
      this.isManagingLead.set(true);
      this.detailDialogOpen.set(false);
      this.quickDialogOpen.set(true);
    } catch (error) {
      this.detail.set(null);
      this.errorMessage.set(this.errorMessageFrom(error, 'No se pudo abrir la gestión del lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  override requestCloseDetail(): void {
    if (this.isSaving()) return;
    void this.minimizeDetail();
  }

  /** Cierra la captura rápida sin guardar cambios pendientes. */
  async requestCloseQuickDialog(): Promise<void> {
    if (this.isSaving()) return;
    if (
      this.hasUnsavedModalChanges()
      && !window.confirm('Hay cambios sin guardar. ¿Deseas descartarlos y cerrar?')
    ) {
      return;
    }
    this.closeSupervisorDetail();
    await this.refreshSupervisorRows();
  }

  onQuickDialogVisibilityChange(visible: boolean): void {
    if (visible) {
      this.quickDialogOpen.set(true);
      return;
    }
    void this.requestCloseQuickDialog();
  }

  async saveAndCloseQuickDialog(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.isSaving()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      if (!(await this.savePendingChanges(detail))) return;
      this.successMessage.set('Datos básicos guardados correctamente.');
      this.closeSupervisorDetail();
      await this.refreshSupervisorRows();
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Promueve la captura rápida al drawer completo sin tomar gestión ni cambiar asignaciones. */
  openFullManagement(): void {
    if (!this.detail() || this.isSaving()) return;
    this.quickDialogOpen.set(false);
    this.detailDialogOpen.set(true);
    this.isManagingLead.set(true);
  }

  supervisorProviderLabel(): string {
    const detail = this.detail();
    return this.ofertaProviderOptions().find((item) => item.id === this.selectedOfertaProviderId())?.nombre
      ?? detail?.nombreProveedorCampana
      ?? 'Proveedor no informado';
  }

  supervisorContactLabel(): string {
    const detail = this.detail();
    if (!detail) return 'Sin contacto';
    if (this.hasLeadPhone(detail)) return `${detail.prefijo ?? ''} ${detail.lead ?? ''}`.trim();
    return detail.usermeta ? `@${detail.usermeta.replace(/^@/, '')}` : 'Sin identidad registrada';
  }

  supervisorContactChannelsLabel(): string {
    const detail = this.detail();
    if (!detail) return 'Sin canales registrados';
    const hasPhone = this.hasLeadPhone(detail);
    const hasWhatsApp = Boolean(detail.usermeta?.trim());
    if (hasPhone && hasWhatsApp) return 'Teléfono y WhatsApp disponibles';
    if (hasPhone) return 'Teléfono disponible';
    if (hasWhatsApp) return 'WhatsApp disponible';
    return 'Sin canales registrados';
  }

  override async minimizeDetail(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.isSaving()) return;
    this.isSaving.set(true);
    try {
      const saved = await this.savePendingChanges(detail);
      if (!saved) return;
      this.closeSupervisorDetail();
      await this.refreshSupervisorRows();
    } finally {
      this.isSaving.set(false);
    }
  }

  override async registrarLlamada(): Promise<void> {
    const detail = this.detail();
    const url = detail ? buildTelUrl(detail.prefijo, detail.lead) : null;
    if (!url) {
      this.errorMessage.set('El lead no tiene un número válido para iniciar la llamada.');
      return;
    }
    window.location.assign(url);
    await this.registrarContactoSupervisor();
  }

  override async registrarLlamadaOperativa(): Promise<void> {
    await this.registrarContactoSupervisor();
  }

  override async registrarChat(): Promise<void> {
    const detail = this.detail();
    const url = detail ? buildWhatsAppUrl(detail.prefijo, detail.lead, detail.usermeta) : null;
    if (!url) {
      this.errorMessage.set('El lead no tiene teléfono ni usermeta para abrir WhatsApp.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    await this.registrarContactoSupervisor();
  }

  override async tipificar(_crearNuevaOportunidad = false): Promise<void> {
    const detail = this.detail();
    if (!detail || this.tipificacionForm.invalid) {
      this.errorMessage.set('Selecciona tipificación y subtipificación.');
      return;
    }
    if (this.requiresScheduledTime() && !this.tipificacionForm.controls.horaProgramada.value) {
      this.errorMessage.set('La hora programada es obligatoria para AGENDADO.');
      return;
    }

    const raw = this.tipificacionForm.getRawValue();
    const request: LeadTipificacionRequest = {
      codigoTipificacion: raw.codigoTipificacion,
      codigoSubtipificacion: raw.codigoSubtipificacion,
      comentario: raw.comentario || null,
      horaProgramada: this.requiresScheduledTime() ? raw.horaProgramada || null : null,
      idProveedor: this.selectedOfertaProviderId(),
      idPlataformaDigitalOfrecida: raw.idPlataformaDigitalOfrecida || null,
      tecnologia: this.mostrarDatosClaro() ? (raw.tecnologia || null) : null,
      esFullClaro: this.mostrarDatosClaro() ? raw.esFullClaro : false
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      if (!(await this.savePendingChanges(detail))) return;
      await firstValueFrom(this.supervisorService.tipificarLeadSupervisorGtr(detail.id, request));
      this.successMessage.set('Lead tipificado correctamente.');
      this.closeSupervisorDetail();
      await this.refreshSupervisorRows();
    } catch (error) {
      this.errorMessage.set(this.errorMessageFrom(error, 'No se pudo tipificar el lead.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  protected override async ensurePlanOfertaZone(detail: LeadDetalleResponse | null): Promise<'READY' | 'FALLBACK' | 'BLOCKED'> {
    if (!detail || !this.selectedOfertaProviderId()) return 'BLOCKED';
    const currentUbigeo = String(this.direccionForm.controls.ubigeoDomicilio.value ?? '').trim();
    const savedUbigeo = String(detail.ubigeoDomicilio ?? '').trim();
    if (detail.idZona && currentUbigeo === savedUbigeo) return 'READY';
    // En Supervisor no guardamos silenciosamente la dirección al abrir el drawer. Los planes se
    // consultan sin filtro de zona y la dirección se persiste solo al pulsar Guardar/tipificar.
    return 'FALLBACK';
  }

  private async savePendingChanges(detail: LeadDetalleResponse): Promise<boolean> {
    const tasks: Array<{ label: string; run: () => Promise<void>; pristine: () => void }> = [];
    const identity = this.getIdentidadRequest(detail);
    if (identity) {
      if (this.identidadForm.invalid) {
        this.identidadForm.markAllAsTouched();
        this.errorMessage.set(this.identidadErrorMessage() ?? 'Completa un número de contacto válido.');
        return false;
      }
      tasks.push({
        label: 'Identidad',
        run: () => firstValueFrom(this.supervisorService.completarIdentidadLeadSupervisorGtr(detail.id, identity)),
        pristine: () => this.identidadForm.markAsPristine()
      });
    }

    if (this.isSnapshotOnlySupervisor()) {
      const raw = this.datosForm.getRawValue();
      const address = this.direccionForm.controls.direccion.value || null;
      tasks.push({
        label: 'Captura rápida',
        run: () => firstValueFrom(this.supervisorService.actualizarSnapshotsLeadSupervisorGtr(detail.id, {
          numeroDocumentoTitularServicio: raw.numeroDocumentoTitularServicio || null,
          direccion: address
        })),
        pristine: () => {
          this.datosForm.markAsPristine();
          this.direccionForm.markAsPristine();
        }
      });
    } else {
      if (this.datosForm.dirty) {
        if (this.datosForm.invalid) {
          this.errorMessage.set(this.getDatosValidationMessage());
          return false;
        }
        tasks.push({
          label: 'Datos personales',
          run: () => firstValueFrom(this.supervisorService.actualizarDatosPreventaSupervisorGtr(
            detail.id,
            this.cleanObject(this.datosForm.getRawValue()) as LeadDatosPreventaRequest
          )),
          pristine: () => this.datosForm.markAsPristine()
        });
      }
      if (this.direccionForm.dirty) {
        if (this.direccionForm.invalid) {
          this.errorMessage.set(this.getDireccionValidationMessage());
          return false;
        }
        tasks.push({
          label: 'Dirección',
          run: () => firstValueFrom(this.supervisorService.actualizarDireccionSupervisorGtr(detail.id, this.getDireccionRequest())),
          pristine: () => this.direccionForm.markAsPristine()
        });
      }
      if (this.ofertaForm.dirty) {
        tasks.push({
          label: 'Oferta comercial',
          run: () => firstValueFrom(this.supervisorService.actualizarOfertaComercialSupervisorGtr(detail.id, this.getOfertaRequest())),
          pristine: () => this.ofertaForm.markAsPristine()
        });
      }
    }

    for (const task of tasks) {
      try {
        await task.run();
        task.pristine();
      } catch (error) {
        this.errorMessage.set(`${task.label}: ${this.errorMessageFrom(error, 'no se pudo guardar')}`);
        return false;
      }
    }
    return true;
  }

  private isSnapshotOnlySupervisor(): boolean {
    const data = this.datosForm.controls;
    const address = this.direccionForm.controls;
    const dataExtras = [
      data.ubigeoNacimiento, data.nombreTitularServicio, data.celularRegistro, data.celularReferencia,
      data.celularGrabacion, data.correo, data.fechaNacimiento, data.parentesco, data.nombreMadre,
      data.nombrePadre, data.numeroDocumentoTitularCelularRegistro, data.nombreTitularCelularRegistro
    ].some((control) => control.dirty);
    const addressExtras = [
      address.idDepartamentoDomicilio, address.idProvinciaDomicilio, address.idDistritoDomicilio,
      address.ubigeoDomicilio, address.idTipoDomicilio, address.tipoUrbanizacion, address.tipoVia,
      address.via, address.referencia, address.latitud, address.longitud, address.urbanizacion,
      address.numero, address.manzana, address.lote, address.nombreEdificio, address.nombreCondominio,
      address.piso, address.interior, address.plano, address.esJalaCobertura, address.esZonaPintada
    ].some((control) => control.dirty);
    return (data.numeroDocumentoTitularServicio.dirty || address.direccion.dirty)
      && !dataExtras && !addressExtras && !this.ofertaForm.dirty;
  }

  private async registrarContactoSupervisor(): Promise<void> {
    const detail = this.detail();
    if (!detail) return;
    try {
      await firstValueFrom(this.supervisorService.registrarContactoSupervisorGtr(detail.id));
      this.successMessage.set('Contacto registrado.');
    } catch (error) {
      this.errorMessage.set(this.errorMessageFrom(error, 'No se pudo registrar el contacto.'));
    }
  }

  private closeSupervisorDetail(): void {
    this.quickDialogOpen.set(false);
    this.detailDialogOpen.set(false);
    this.detail.set(null);
    this.selectedLeadId.set(null);
    this.isManagingLead.set(false);
    this.identidadEditorOpen.set(false);
    this.tipificacionForm.reset({
      codigoTipificacion: '', codigoSubtipificacion: '', comentario: '', horaProgramada: '',
      idPlataformaDigitalOfrecida: null, tecnologia: '', esFullClaro: false
    });
  }

  private async refreshSupervisorRows(): Promise<void> {
    await this.supervisorPage.cargarLeadsSinEquipo(this.supervisorPage.paginaActual());
  }

  private updateSupervisorIdentityValidation(prefijo?: string | null): void {
    const normalized = String(prefijo ?? '').trim();
    const lead = this.identidadForm.controls.lead;
    const isPeru = normalized === '+51';
    this.identidadNumberMaxLength.set(isPeru ? 9 : 15);
    lead.setValidators([Validators.required, Validators.pattern(isPeru ? /^9\d{8}$/ : /^\d{6,15}$/)]);
    lead.updateValueAndValidity({ emitEvent: false });
  }

  private errorMessageFrom(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) return formatApiErrorMessage(error.error, fallback);
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
