import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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
  private readonly realtimeSubscription = new Subscription();

  protected readonly leadQuery = signal('');
  protected readonly candidates = signal<LeadCampanaCorreccionCandidatoResponse[]>([]);
  protected readonly selectedCandidate = signal<LeadCampanaCorreccionCandidatoResponse | null>(null);
  protected readonly activeCampaigns = signal<CampanaResponse[]>([]);
  protected readonly selectedCampaignId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly lastResult = signal<LeadCampanaCorreccionResponse | null>(null);

  protected readonly campaignOptions = computed<CampaignCorrectionOption[]>(() => [
    { label: 'Sin campaña', value: null },
    ...this.activeCampaigns().map((campaign) => ({
      label: campaign.nombre ?? `Campaña ${campaign.id}`,
      value: campaign.id
    }))
  ]);

  ngOnInit(): void {
    void this.loadCampaigns();
    this.startRealtime();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription.unsubscribe();
  }

  protected async search(showLoading = true): Promise<void> {
    const lead = this.normalizeLead(this.leadQuery());
    this.clearMessages();
    this.lastResult.set(null);

    if (!lead) {
      this.errorMessage.set('Ingresa un número de lead para buscar.');
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    try {
      const results = await firstValueFrom(this.leadService.buscarCorreccionCampanaLead(lead));
      this.candidates.set(results);
      if (results.length === 1) {
        this.selectCandidate(results[0]);
      } else {
        this.selectedCandidate.set(null);
        this.selectedCampaignId.set(null);
      }
      if (!results.length) {
        this.errorMessage.set('No encontramos un lead con ese número.');
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo buscar el lead.'));
    } finally {
      if (showLoading) {
        this.isLoading.set(false);
      }
    }
  }

  protected selectCandidate(candidate: LeadCampanaCorreccionCandidatoResponse): void {
    this.selectedCandidate.set(candidate);
    this.selectedCampaignId.set(candidate.idCampanaActual ?? null);
    this.clearMessages();
    this.lastResult.set(null);
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
      message: `Se actualizará la campaña del lead ${candidate.lead} y sus eventos asociados a: ${targetLabel}.`,
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

  private async saveCorrection(candidate: LeadCampanaCorreccionCandidatoResponse): Promise<void> {
    this.isSaving.set(true);
    this.clearMessages();
    try {
      const response = await firstValueFrom(
        this.leadService.corregirCampanaLead(candidate.idLead, this.selectedCampaignId())
      );
      this.lastResult.set(response);
      this.successMessage.set(`Campaña corregida. Se actualizaron ${response.eventosActualizados} eventos.`);
      await this.search(false);
      const refreshed = this.candidates().find((item) => item.idLead === candidate.idLead);
      if (refreshed) {
        this.selectCandidate(refreshed);
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo corregir la campaña.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadCampaigns(): Promise<void> {
    try {
      this.activeCampaigns.set(await firstValueFrom(this.leadService.listarCampanas(true)));
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar las campañas activas.'));
    }
  }

  private startRealtime(): void {
    this.realtimeSubscription.add(
      this.realtimeService.watchTopic('/topic/leads').subscribe({
        next: (event) => {
          if (event.tipo !== 'CAMPANA_CORREGIDA' || !event.idLead) {
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

  private normalizeLead(value: string): string {
    return value.replace(/\s+/g, '').trim();
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
