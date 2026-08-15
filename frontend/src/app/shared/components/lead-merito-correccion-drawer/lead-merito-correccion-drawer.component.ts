import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { UsuarioResponse } from '../../models/auth/usuario-response';
import {
  LeadMeritoCorreccionCandidatoResponse,
  LeadMeritoCorreccionResponse
} from '../../models/preventa/preventa.models';
import { providerLogo } from '../../utils/provider-logo';
import { PreventaLeadService } from '../../../features/preventa/services/preventa-lead.service';

@Component({
  selector: 'app-lead-merito-correccion-drawer',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    ConfirmDialogModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    TagModule
  ],
  providers: [ConfirmationService],
  templateUrl: './lead-merito-correccion-drawer.component.html',
  styleUrl: './lead-merito-correccion-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadMeritoCorreccionDrawerComponent {
  private readonly preventaLeadService = inject(PreventaLeadService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly visible = signal(false);
  protected readonly leadQuery = signal('');
  protected readonly candidates = signal<LeadMeritoCorreccionCandidatoResponse[]>([]);
  protected readonly selectedCandidate = signal<LeadMeritoCorreccionCandidatoResponse | null>(null);
  protected readonly asesores = signal<UsuarioResponse[]>([]);
  protected readonly asesorSuggestions = signal<UsuarioResponse[]>([]);
  protected readonly selectedAsesor = signal<UsuarioResponse | null>(null);
  protected readonly motivo = signal('');
  protected readonly isSearching = signal(false);
  protected readonly isLoadingAsesores = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly lastResult = signal<LeadMeritoCorreccionResponse | null>(null);

  protected readonly canApply = computed(() => {
    const candidate = this.selectedCandidate();
    return Boolean(candidate?.corregible && this.selectedAsesor() && !this.isSaving());
  });

  protected readonly providerName = computed(() => {
    const candidate = this.selectedCandidate();
    return candidate?.nombreProveedorCampana ?? candidate?.nombreProveedorEquipo ?? null;
  });

  protected readonly providerLogo = computed(() => providerLogo(this.providerName()));

  open(): void {
    this.visible.set(true);
  }

  protected close(): void {
    this.visible.set(false);
  }

  protected onVisibleChange(value: boolean): void {
    this.visible.set(value);
  }

  protected async search(): Promise<void> {
    const lead = this.normalizeLead(this.leadQuery());
    this.clearMessages();
    this.lastResult.set(null);
    this.candidates.set([]);
    this.selectedCandidate.set(null);
    this.selectedAsesor.set(null);
    this.asesores.set([]);
    this.asesorSuggestions.set([]);

    if (!lead) {
      this.errorMessage.set('Ingresa un numero de lead para buscar.');
      return;
    }

    this.isSearching.set(true);
    try {
      const results = await firstValueFrom(this.preventaLeadService.buscarCorreccionMeritoPreventa(lead));
      this.candidates.set(results);
      if (results.length === 0) {
        this.errorMessage.set('No encontramos un lead con ese numero.');
        return;
      }
      await this.selectCandidate(results[0]);
    } catch (error) {
      this.errorMessage.set(this.errorMessageFrom(error, 'No se pudo buscar el lead.'));
    } finally {
      this.isSearching.set(false);
    }
  }

  protected async selectCandidate(candidate: LeadMeritoCorreccionCandidatoResponse): Promise<void> {
    this.clearMessages();
    this.selectedCandidate.set(candidate);
    this.selectedAsesor.set(null);
    this.asesores.set([]);
    this.asesorSuggestions.set([]);
    if (!candidate.corregible || !candidate.idEquipo) {
      return;
    }
    await this.loadAsesores(candidate);
  }

  protected completeAsesores(event: { query: string }): void {
    const query = (event.query ?? '').trim().toLowerCase();
    const currentMerito = this.selectedCandidate()?.idAsesorMeritoActualPreventa;
    const matches = this.asesores()
      .filter((asesor) => asesor.empleadoId !== currentMerito)
      .filter((asesor) => this.isAsesorVentas(asesor))
      .filter((asesor) => this.matchesAsesor(asesor, query))
      .slice(0, 8);
    this.asesorSuggestions.set(matches);
  }

  protected applyCorrection(): void {
    const candidate = this.selectedCandidate();
    const asesor = this.selectedAsesor();
    if (!candidate || !asesor) {
      this.errorMessage.set('Selecciona el asesor objetivo.');
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar correccion de merito',
      message: `El lead ${candidate.lead} otorgara el merito de la PREVENTA a ${asesor.nombreCompleto}. Esta correccion no se podra volver a realizar.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Aplicar correccion',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.submitCorrection(candidate, asesor)
    });
  }

  protected display(value?: string | number | null): string {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  protected etapaLabel(etapa?: string | null): string {
    return etapa === 'POSTVENTA' ? 'INSTALADO' : this.display(etapa);
  }

  protected estadoSeverity(value?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (value) {
      case 'ACTIVO':
      case 'GESTIONADO':
        return 'success';
      case 'VENTA':
      case 'ASIGNADO':
      case 'EN_GESTION':
        return 'info';
      case 'SUSPENDIDO':
      case 'AGENDADO':
        return 'warn';
      case 'BAJA':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  protected asesorLabel(asesor: UsuarioResponse): string {
    const doc = asesor.dni ? ` · ${asesor.dni}` : '';
    return `${asesor.nombreCompleto}${doc}`;
  }

  private async loadAsesores(candidate: LeadMeritoCorreccionCandidatoResponse): Promise<void> {
    if (!candidate.idEquipo) {
      return;
    }
    this.isLoadingAsesores.set(true);
    try {
      const asesores = await firstValueFrom(this.preventaLeadService.listarAsesoresVentasMeritoPorEquipo(candidate.idEquipo));
      const filtrados = asesores
        .filter((asesor) => this.isAsesorVentas(asesor))
        .filter((asesor) => asesor.empleadoId !== candidate.idAsesorMeritoActualPreventa);
      this.asesores.set(filtrados);
      this.asesorSuggestions.set(filtrados.slice(0, 8));
    } catch (error) {
      this.errorMessage.set(this.errorMessageFrom(error, 'No se pudo cargar la lista de asesores.'));
    } finally {
      this.isLoadingAsesores.set(false);
    }
  }

  private async submitCorrection(
    candidate: LeadMeritoCorreccionCandidatoResponse,
    asesor: UsuarioResponse
  ): Promise<void> {
    this.clearMessages();
    this.isSaving.set(true);
    try {
      const result = await firstValueFrom(this.preventaLeadService.corregirMeritoPreventa(candidate.idLead, {
        idAsesorMerito: asesor.empleadoId,
        motivo: this.normalizeOptionalText(this.motivo())
      }));
      this.lastResult.set(result);
      this.successMessage.set(`Merito corregido para ${result.nombreAsesorNuevo}.`);
      this.selectedAsesor.set(null);
      this.motivo.set('');
      await this.refreshCurrentLead();
    } catch (error) {
      this.errorMessage.set(this.errorMessageFrom(error, 'No se pudo aplicar la correccion.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  private async refreshCurrentLead(): Promise<void> {
    const lead = this.normalizeLead(this.leadQuery());
    if (!lead) {
      return;
    }
    const results = await firstValueFrom(this.preventaLeadService.buscarCorreccionMeritoPreventa(lead));
    this.candidates.set(results);
    const current = this.selectedCandidate();
    this.selectedCandidate.set(results.find((candidate) => candidate.idLead === current?.idLead) ?? results[0] ?? null);
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private normalizeLead(value: string): string {
    return (value ?? '').replace(/\D+/g, '');
  }

  private normalizeOptionalText(value: string): string | null {
    const normalized = (value ?? '').trim();
    return normalized || null;
  }

  private isAsesorVentas(asesor: UsuarioResponse): boolean {
    return asesor.roles?.includes('ASESOR_VENTAS') ?? false;
  }

  private matchesAsesor(asesor: UsuarioResponse, query: string): boolean {
    if (!query) {
      return true;
    }
    const haystack = [
      asesor.nombreCompleto,
      asesor.username,
      asesor.dni,
      String(asesor.empleadoId)
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  private errorMessageFrom(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? fallback;
    }
    return fallback;
  }
}
