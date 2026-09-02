import { DOCUMENT, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { SessionService } from '../../../core/services/session.service';
import { Etapa } from '../../models/preventa/preventa.models';
import { UsuarioResponse } from '../../models/auth/usuario-response';
import {
  LeadMeritoCorreccionCandidatoResponse,
  LeadMeritoCorreccionResponse
} from '../../models/preventa/preventa.models';
import { providerLogo } from '../../utils/provider-logo';
import { PreventaLeadService } from '../../../features/preventa/services/preventa-lead.service';

interface EtapaOption {
  label: string;
  value: Etapa;
}

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
    SelectButtonModule,
    TagModule
  ],
  providers: [ConfirmationService],
  templateUrl: './lead-merito-correccion-drawer.component.html',
  styleUrl: './lead-merito-correccion-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadMeritoCorreccionDrawerComponent implements OnDestroy {
  private readonly preventaLeadService = inject(PreventaLeadService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly sessionService = inject(SessionService);
  private readonly document = inject(DOCUMENT);
  private readonly scrollLockClass = 'merito-drawer-scroll-lock';
  private scrollLocked = false;
  private scrollTop = 0;

  protected readonly isAdmin = computed(() => this.sessionService.getPrimaryRole() === 'ADMINISTRADOR');

  protected readonly etapaOptions: EtapaOption[] = [
    { label: 'Preventa', value: 'PREVENTA' as Etapa },
    { label: 'Venta', value: 'VENTA' as Etapa },
    { label: 'Postventa', value: 'POSTVENTA' as Etapa }
  ];

  protected readonly visible = signal(false);
  protected readonly leadQuery = signal('');
  protected readonly candidates = signal<LeadMeritoCorreccionCandidatoResponse[]>([]);
  protected readonly selectedCandidate = signal<LeadMeritoCorreccionCandidatoResponse | null>(null);
  protected readonly asesores = signal<UsuarioResponse[]>([]);
  protected readonly asesorSuggestions = signal<UsuarioResponse[]>([]);
  protected readonly selectedAsesor = signal<UsuarioResponse | null>(null);
  protected readonly motivo = signal('');
  protected readonly selectedEtapa = signal<Etapa>('PREVENTA' as Etapa);
  protected readonly isSearching = signal(false);
  protected readonly isLoadingAsesores = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly lastResult = signal<LeadMeritoCorreccionResponse | null>(null);

  protected readonly canApply = computed(() => {
    const candidate = this.selectedCandidate();
    const asesor = this.selectedAsesor();
    if (!asesor || this.isSaving()) {
      return false;
    }
    if (this.isAdmin()) {
      return true;
    }
    return Boolean(candidate?.corregible);
  });

  protected readonly providerName = computed(() => {
    const candidate = this.selectedCandidate();
    return candidate?.nombreProveedorCampana ?? candidate?.nombreProveedorEquipo ?? null;
  });

  protected readonly providerLogo = computed(() => providerLogo(this.providerName()));

  protected readonly empleadoLabel = computed(() =>
    this.isAdmin() ? 'Empleado objetivo' : 'Asesor objetivo'
  );

  constructor() {
    effect(() => {
      this.setScrollLock(this.visible());
    });
  }

  ngOnDestroy(): void {
    this.setScrollLock(false);
  }

  open(): void {
    this.visible.set(true);
  }

  protected close(): void {
    this.visible.set(false);
  }

  protected onVisibleChange(value: boolean): void {
    this.visible.set(value);
  }

  protected onEtapaChange(): void {
    this.selectedAsesor.set(null);
    this.asesores.set([]);
    this.asesorSuggestions.set([]);
    const candidate = this.selectedCandidate();
    if (candidate?.idEquipo) {
      void this.loadAsesores(candidate);
    }
  }

  private setScrollLock(locked: boolean): void {
    if (this.scrollLocked === locked) {
      return;
    }

    const body = this.document.body;
    const root = this.document.documentElement;
    const view = this.document.defaultView;

    if (!body || !root || !view) {
      return;
    }

    this.scrollLocked = locked;
    root.classList.toggle(this.scrollLockClass, locked);
    body.classList.toggle(this.scrollLockClass, locked);

    if (locked) {
      this.scrollTop = view.scrollY || root.scrollTop || body.scrollTop || 0;
      body.style.top = `-${this.scrollTop}px`;
      return;
    }

    body.style.top = '';
    view.scrollTo({ top: this.scrollTop, left: 0, behavior: 'auto' });
    this.scrollTop = 0;
  }

  protected async search(): Promise<void> {
    const searchTerm = this.normalizeSearchTerm(this.leadQuery());
    this.clearMessages();
    this.lastResult.set(null);
    this.candidates.set([]);
    this.selectedCandidate.set(null);
    this.selectedAsesor.set(null);
    this.asesores.set([]);
    this.asesorSuggestions.set([]);

    if (!searchTerm) {
      this.errorMessage.set('Ingresa el lead, documento o @usermeta que quieres buscar.');
      return;
    }

    this.leadQuery.set(searchTerm);
    this.isSearching.set(true);
    try {
      const results = await firstValueFrom(this.preventaLeadService.buscarCorreccionMeritoPreventa(searchTerm));
      this.candidates.set(results);
      if (results.length === 0) {
        this.errorMessage.set('No encontramos ese lead, documento o @usermeta.');
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
    const loadable = this.isAdmin() ? Boolean(candidate.idEquipo) : Boolean(candidate.corregible && candidate.idEquipo);
    if (!loadable) {
      return;
    }
    await this.loadAsesores(candidate);
  }

  protected completeAsesores(event: { query: string }): void {
    const query = (event.query ?? '').trim().toLowerCase();
    const currentMerito = this.selectedCandidate()?.idAsesorMeritoActualPreventa;
    const matches = this.asesores()
      .filter((asesor) => asesor.empleadoId !== currentMerito)
      .filter((asesor) => this.isAdmin() || this.isAsesorVentas(asesor))
      .filter((asesor) => this.matchesAsesor(asesor, query));
    this.asesorSuggestions.set(matches);
  }

  protected applyCorrection(): void {
    const candidate = this.selectedCandidate();
    const asesor = this.selectedAsesor();
    if (!candidate || !asesor) {
      this.errorMessage.set('Selecciona el empleado objetivo.');
      return;
    }

    const etapaLabel = this.etapaDisplayLabel(this.selectedEtapa());
    this.confirmationService.confirm({
      header: 'Confirmar correccion de merito',
      message: `El lead ${candidate.lead} otorgara el merito de ${etapaLabel} a ${asesor.nombreCompleto}. Esta correccion no se podra volver a realizar.`,
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

  private etapaDisplayLabel(etapa: Etapa): string {
    switch (etapa) {
      case 'PREVENTA' as Etapa: return 'PREVENTA';
      case 'VENTA' as Etapa: return 'VENTA';
      case 'POSTVENTA' as Etapa: return 'POSTVENTA';
      default: return String(etapa);
    }
  }

  private async loadAsesores(candidate: LeadMeritoCorreccionCandidatoResponse): Promise<void> {
    if (!candidate.idEquipo) {
      return;
    }
    this.isLoadingAsesores.set(true);
    try {
      const asesores = this.isAdmin()
        ? await firstValueFrom(this.preventaLeadService.listarEmpleadosMeritoAdmin(candidate.idEquipo, this.selectedEtapa()))
        : await firstValueFrom(this.preventaLeadService.listarAsesoresVentasMeritoPorEquipo(candidate.idEquipo));

      const filtrados = this.isAdmin()
        ? asesores.filter((a) => a.empleadoId !== candidate.idAsesorMeritoActualPreventa)
        : asesores
            .filter((a) => this.isAsesorVentas(a))
            .filter((a) => a.empleadoId !== candidate.idAsesorMeritoActualPreventa);

      this.asesores.set(filtrados);
      this.asesorSuggestions.set(filtrados);
    } catch (error) {
      this.errorMessage.set(this.errorMessageFrom(error, 'No se pudo cargar la lista de empleados.'));
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
      const result = this.isAdmin()
        ? await firstValueFrom(this.preventaLeadService.corregirMeritoAdmin(candidate.idLead, {
            etapaMerito: this.selectedEtapa(),
            idAsesorMerito: asesor.empleadoId,
            motivo: this.normalizeOptionalText(this.motivo())
          }))
        : await firstValueFrom(this.preventaLeadService.corregirMeritoPreventa(candidate.idLead, {
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
    const searchTerm = this.normalizeSearchTerm(this.leadQuery());
    if (!searchTerm) {
      return;
    }
    const results = await firstValueFrom(this.preventaLeadService.buscarCorreccionMeritoPreventa(searchTerm));
    this.candidates.set(results);
    const current = this.selectedCandidate();
    this.selectedCandidate.set(results.find((candidate) => candidate.idLead === current?.idLead) ?? results[0] ?? null);
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private normalizeSearchTerm(value: string): string {
    const raw = (value ?? '').trim();
    if (!raw) {
      return '';
    }
    if (raw.startsWith('@')) {
      const usermeta = raw.replace(/\s+/g, '').replace(/^@+/, '');
      return usermeta ? `@${usermeta}` : '';
    }
    return raw.replace(/\D+/g, '');
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
