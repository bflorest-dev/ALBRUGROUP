import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { AsesorVentasWorkspaceFacade } from '../../asesor-ventas/facades/asesor-ventas-workspace.facade';
import { GtrWorkspaceFacade } from './gtr-workspace.facade';

type GtrV2PendingTakeover = {
  idLead: number;
  leadLabel: string;
  currentAdvisorName: string;
  requiresInManagement: boolean;
  requiresReassignment: boolean;
  requiresPreviousManagement: boolean;
  previousManagementAt?: string | null;
};

type AssignmentConflictDetails = {
  tipo?: string;
  nombreAsesorActual?: string | null;
  ultimaGestionAt?: string | null;
  requiereConfirmarLeadEnGestion?: boolean;
  requiereConfirmarReasignacion?: boolean;
  requiereConfirmarGestionPrevia?: boolean;
};

/**
 * Adaptador del Drawer V2 para el rol ASESOR_GTR.
 *
 * El componente visual comparte el contrato del asesor de ventas, pero la entrada GTR conserva su
 * toma de gestión, confirmaciones de reasignación y refresco de bandeja. No inicializa la bandeja
 * del asesor de ventas ni usa los endpoints especializados del supervisor GTR.
 */
@Injectable()
export class AsesorGtrPreventaDrawerV2Facade extends AsesorVentasWorkspaceFacade {
  private readonly gtrFacade = inject(GtrWorkspaceFacade);
  private readonly destroyRef = inject(DestroyRef);

  override readonly canDisplayOperationalData = this.gtrFacade.canDisplayOperationalData;
  override readonly canMutateOperationalData = this.gtrFacade.canMutateOperationalData;
  /**
   * En GTR la validación de cierre debe seguir el destino real de la subtipificación. El catálogo
   * puede conservar comportamientos históricos de cierre para una subtipificación que permanece en
   * PREVENTA; usar ese flag aquí bloquea tipificaciones informativas con datos de venta incompletos.
   */
  override readonly requiresVentaCompleta = computed(
    () => this.selectedSubtipificacion()?.etapaCambio === 'VENTA'
  );

  readonly pendingTakeover = signal<GtrV2PendingTakeover | null>(null);
  readonly takeoverDialogOpen = computed(() => this.pendingTakeover() !== null);

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
      .subscribe((prefijo) => this.updateIdentidadLeadValidation(prefijo));
  }

  /** El ciclo de vida de la bandeja GTR pertenece a GtrWorkspaceFacade. */
  override async initialize(): Promise<void> {
    return Promise.resolve();
  }

  override async openDetail(idLead: number): Promise<void> {
    await this.openDetailWithOptions(idLead);
  }

  private async openDetailWithOptions(
    idLead: number,
    options: { confirmarReasignacion?: boolean; confirmarGestionPrevia?: boolean } = {}
  ): Promise<void> {
    if (!this.canMutateOperationalData()) {
      this.errorMessage.set('Marca ONLINE para gestionar Leads.');
      return;
    }
    if ((this.detailDialogOpen() || this.isManagingLead()) && this.detail()?.id !== idLead) {
      this.errorMessage.set('Tipifica o minimiza el Lead actual antes de abrir otro lead.');
      return;
    }

    this.pendingTakeover.set(null);
    this.detail.set(null);
    this.detailDialogOpen.set(false);
    this.selectedLeadId.set(idLead);
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await firstValueFrom(this.preventaService.tomarGestionGtr(idLead, options));
      const detail = await firstValueFrom(this.preventaService.obtenerDetalleAsesor(idLead));

      this.detail.set(detail);
      this.atencionLeadId.set(detail.atencionOtraEtapa ? idLead : null);
      await this.ensureDrawerCatalogs();
      this.patchForms(detail);
      await this.refreshOfferCatalogs(detail.idPlan ?? 0, this.resolveProveedorOfertaInicial(detail));
      await this.cargarCatalogoDelLead(idLead, this.selectedOfertaProviderId());

      this.isManagingLead.set(true);
      this.detailDialogOpen.set(true);
      this.gtrFacade.closeDialog();
    } catch (error) {
      this.detail.set(null);
      this.selectedLeadId.set(null);
      if (!this.handleTakeoverConflict(error, idLead)) {
        this.errorMessage.set(this.getOpenError(error));
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  async confirmTakeover(): Promise<void> {
    const pending = this.pendingTakeover();
    if (!pending) {
      return;
    }
    await this.openDetailWithOptions(pending.idLead, {
      confirmarReasignacion: pending.requiresReassignment,
      confirmarGestionPrevia: pending.requiresPreviousManagement
    });
  }

  cancelTakeover(): void {
    this.pendingTakeover.set(null);
    this.errorMessage.set(null);
  }

  override requestCloseDetail(): void {
    if (this.isSaving()) {
      return;
    }
    const wasOpen = this.detailDialogOpen();
    super.requestCloseDetail();
    if (wasOpen && !this.detailDialogOpen()) {
      void this.refreshGtrAfterDrawerChange();
    }
  }

  override async minimizeDetail(): Promise<void> {
    const wasOpen = this.detailDialogOpen();
    await super.minimizeDetail();
    if (wasOpen && !this.detailDialogOpen()) {
      await this.refreshGtrAfterDrawerChange();
    }
  }

  override async tipificar(crearNuevaOportunidad = false): Promise<void> {
    const wasOpen = this.detailDialogOpen();
    const currentLeadId = this.detail()?.id ?? null;
    await super.tipificar(crearNuevaOportunidad);

    const changedLead = currentLeadId !== null && this.detail()?.id !== currentLeadId;
    if (wasOpen && (!this.detailDialogOpen() || changedLead)) {
      await this.refreshGtrAfterDrawerChange();
    }
  }

  override async crearOportunidadV2(): Promise<void> {
    await super.crearOportunidadV2();
    await this.refreshGtrAfterDrawerChange();
  }

  private async refreshGtrAfterDrawerChange(): Promise<void> {
    this.gtrFacade.closeDialog();
    await this.gtrFacade.refreshAfterDrawerChange();
  }

  private handleTakeoverConflict(error: unknown, idLead: number): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
      return false;
    }

    const details = (error.error as { details?: AssignmentConflictDetails } | null)?.details;
    const requiresInManagement =
      Boolean(details?.requiereConfirmarLeadEnGestion) ||
      details?.tipo === 'LEAD_EN_GESTION';
    const requiresReassignment =
      requiresInManagement ||
      Boolean(details?.requiereConfirmarReasignacion) ||
      details?.tipo === 'LEAD_YA_ASIGNADO' ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA';
    const requiresPreviousManagement =
      Boolean(details?.requiereConfirmarGestionPrevia) ||
      details?.tipo === 'ASESOR_YA_GESTIONO_LEAD' ||
      details?.tipo === 'CONFIRMACION_ASIGNACION_REQUERIDA';

    if (!requiresReassignment && !requiresPreviousManagement) {
      return false;
    }

    this.pendingTakeover.set({
      idLead,
      leadLabel: this.takeoverLeadLabel(idLead),
      currentAdvisorName: details?.nombreAsesorActual || 'otro asesor',
      requiresInManagement,
      requiresReassignment,
      requiresPreviousManagement,
      previousManagementAt: details?.ultimaGestionAt ?? null
    });
    return true;
  }

  private takeoverLeadLabel(idLead: number): string {
    const row = this.gtrFacade.selectedSnapshotLead();
    if (row?.id === idLead) {
      return this.gtrFacade.leadIdentity(row);
    }
    return `Lead ${idLead}`;
  }

  private getOpenError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const responseError = error.error as { message?: string; error?: string } | null;
      const detail = responseError?.message ?? responseError?.error;
      if (error.status === 404) {
        return 'El lead ya no esta disponible para tu equipo.';
      }
      if (error.status === 403) {
        return 'No tienes permiso para tomar este lead.';
      }
      return detail || 'No se pudo preparar el lead para tipificar.';
    }
    if (error instanceof Error) {
      return error.message || 'No se pudo preparar el lead para tipificar.';
    }
    return 'No se pudo preparar el lead para tipificar.';
  }
}
