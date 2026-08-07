import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SessionService } from '../../../../core/services/session.service';
import { LeadRealtimeService } from '../../../preventa/services/lead-realtime.service';
import {
  CampanaResponse,
  CommunityLeadService,
  LeadCampanaCorreccionCandidatoResponse,
  LeadCampanaCorreccionResponse
} from '../../services/community-lead.service';

type CampaignCorrectionOption = {
  label: string;
  value: number | null;
};

@Component({
  selector: 'app-community-campaign-correction-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule
  ],
  providers: [ConfirmationService],
  templateUrl: './community-campaign-correction-page.component.html',
  styleUrl: './community-campaign-correction-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityCampaignCorrectionPageComponent implements OnInit, OnDestroy {
  private readonly leadService = inject(CommunityLeadService);
  private readonly realtimeService = inject(LeadRealtimeService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly sessionService = inject(SessionService);
  private readonly realtimeSubscription = new Subscription();

  protected readonly leadQuery = signal('');
  protected readonly candidates = signal<LeadCampanaCorreccionCandidatoResponse[]>([]);
  protected readonly selectedCandidate = signal<LeadCampanaCorreccionCandidatoResponse | null>(null);
  protected readonly activeCampaigns = signal<CampanaResponse[]>([]);
  protected readonly selectedCampaignId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingCampaigns = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly lastResult = signal<LeadCampanaCorreccionResponse | null>(null);
  protected readonly correctionDialogVisible = signal(false);
  protected readonly correctionDialogMessage = signal<string | null>(null);
  protected readonly pageEyebrow = computed(() =>
    this.sessionService.primaryRole() === 'ADMINISTRADOR' ? 'ADMIN' : 'COMMUNITY'
  );

  protected readonly campaignOptions = computed<CampaignCorrectionOption[]>(() => [
    { label: 'Sin campaña', value: null },
    ...this.activeCampaigns().map((campaign) => ({
      label: campaign.nombre ?? `Campaña ${campaign.id}`,
      value: campaign.id
    }))
  ]);

  protected readonly campaignScopeMessage = computed(() => {
    const candidate = this.selectedCandidate();
    if (!candidate) {
      return null;
    }
    if (candidate.idEquipo === null || candidate.idEquipo === undefined) {
      return 'Este lead no tiene equipo asignado. Solo puedes dejarlo sin campaña.';
    }
    if (!this.isLoadingCampaigns() && this.activeCampaigns().length === 0) {
      return 'No hay campañas activas disponibles para el equipo de este lead.';
    }
    return null;
  });

  ngOnInit(): void {
    this.startRealtime();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
  }

  protected async search(showLoading = true): Promise<void> {
    const lead = this.normalizeLeadOrUsermeta(this.leadQuery());
    this.clearMessages();
    this.lastResult.set(null);

    if (!lead) {
      this.errorMessage.set('Ingresa un numero de lead o usermeta para buscar.');
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    try {
      const results = await firstValueFrom(this.leadService.buscarCorreccionCampanaLead(lead));
      this.candidates.set(results);
      if (results.length === 1) {
        await this.selectCandidate(results[0]);
      } else {
        this.selectedCandidate.set(null);
        this.selectedCampaignId.set(null);
        this.activeCampaigns.set([]);
      }
      if (!results.length) {
        this.errorMessage.set('No encontramos un lead con ese numero o usermeta.');
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo buscar el lead.'));
    } finally {
      if (showLoading) {
        this.isLoading.set(false);
      }
    }
  }

  protected async selectCandidate(candidate: LeadCampanaCorreccionCandidatoResponse): Promise<void> {
    this.selectedCandidate.set(candidate);
    this.selectedCampaignId.set(null);
    this.activeCampaigns.set([]);
    this.clearMessages();
    this.lastResult.set(null);
    await this.loadCompatibleCampaigns(candidate);
    const currentCampaignIsAvailable = this.activeCampaigns().some(
      (campaign) => campaign.id === candidate.idCampanaActual
    );
    this.selectedCampaignId.set(currentCampaignIsAvailable ? candidate.idCampanaActual ?? null : null);
  }

  protected confirmCorrection(): void {
    const candidate = this.selectedCandidate();
    if (!candidate) {
      this.errorMessage.set('Selecciona el lead que deseas corregir.');
      return;
    }

    const targetLabel = this.campaignOptions().find((option) => option.value === this.selectedCampaignId())?.label ?? 'Sin campaña';
    this.confirmationService.confirm({
      header: 'Confirmar corrección',
      message: `Se actualizará la campaña del lead ${this.identityLabel(candidate)} y sus eventos asociados a: ${targetLabel}.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Guardar corrección',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        void this.saveCorrection(candidate);
      }
    });
  }

  protected campaignLabel(candidate: LeadCampanaCorreccionCandidatoResponse | null): string {
    return candidate?.nombreCampanaActual || 'Sin campaña';
  }

  protected display(value: unknown): string {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  protected updateLeadQuery(value: string): void {
    this.leadQuery.set(this.normalizeLeadOrUsermeta(value));
  }

  protected identityLabel(candidate: LeadCampanaCorreccionCandidatoResponse | null): string {
    if (!candidate) {
      return '-';
    }
    const phone = [candidate.prefijo, candidate.lead].filter(Boolean).join(' ').trim();
    const usermeta = candidate.usermeta ? `@${candidate.usermeta}` : '';
    return phone || usermeta || '-';
  }

  protected closeCorrectionDialog(): void {
    this.correctionDialogVisible.set(false);
    this.clearCorrectionView();
  }

  private async saveCorrection(candidate: LeadCampanaCorreccionCandidatoResponse): Promise<void> {
    this.isSaving.set(true);
    this.clearMessages();
    try {
      const response = await firstValueFrom(
        this.leadService.corregirCampanaLead(candidate.idLead, this.selectedCampaignId())
      );
      this.lastResult.set(response);
      this.correctionDialogMessage.set(`Campaña corregida. Se actualizaron ${response.eventosActualizados} eventos.`);
      this.correctionDialogVisible.set(true);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo corregir la campaña.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadCompatibleCampaigns(candidate: LeadCampanaCorreccionCandidatoResponse): Promise<void> {
    if (candidate.idEquipo === null || candidate.idEquipo === undefined) {
      return;
    }
    this.isLoadingCampaigns.set(true);
    try {
      this.activeCampaigns.set(await firstValueFrom(this.leadService.listarCampanasCorreccionLead(candidate.idLead)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las campañas del equipo.'));
    } finally {
      this.isLoadingCampaigns.set(false);
    }
  }

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads').subscribe({
        next: (event) => {
          if (event.tipo !== 'CAMPANA_CORREGIDA' || !event.idLead) {
            return;
          }
          if (this.correctionDialogVisible()) {
            return;
          }
          const affectsCurrentResult =
            this.selectedCandidate()?.idLead === event.idLead ||
            this.candidates().some((candidate) => candidate.idLead === event.idLead);
          if (affectsCurrentResult) {
            void this.search(false);
          }
        },
        error: () => undefined
      })
    );
  }

  private normalizeLeadOrUsermeta(value: string): string {
    const normalized = value.replace(/\s+/g, '');
    if (/^\d+$/.test(normalized)) {
      return normalized.slice(0, 9);
    }
    return normalized.replace(/^@+/, '').slice(0, 80);
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private clearCorrectionView(): void {
    this.leadQuery.set('');
    this.candidates.set([]);
    this.selectedCandidate.set(null);
    this.activeCampaigns.set([]);
    this.selectedCampaignId.set(null);
    this.lastResult.set(null);
    this.correctionDialogMessage.set(null);
    this.clearMessages();
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }
    return fallback;
  }
}
