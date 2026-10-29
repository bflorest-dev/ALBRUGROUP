import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { RecruiterOperationalInboxFacade } from '../../facades/recruiter-operational-inbox.facade';
import { GestionDrawerComponent } from '../../components/gestion-drawer/gestion-drawer.component';
import { RecruiterPostulantesService } from '../../services/recruiter-postulantes.service';
import { SesionMeetResponse } from '../../../../shared/models/recruitment/sesion-meet-response';
import { RecruiterTrainingGroupsFacade } from '../../facades/recruiter-training-groups.facade';
import { RecruiterTrainingGroupsService } from '../../services/recruiter-training-groups.service';
import { TrainingGroupFormPanelComponent } from '../../components/training-group-form-panel/training-group-form-panel.component';

@Component({
  selector: 'app-recruiter-operational-inbox-page',
  imports: [FormsModule, ReactiveFormsModule, GestionDrawerComponent, TrainingGroupFormPanelComponent],
  providers: [RecruiterOperationalInboxFacade, RecruiterTrainingGroupsFacade],
  templateUrl: './operational-inbox-page.component.html',
  styleUrl: './operational-inbox-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalInboxPageComponent implements OnInit {
  protected readonly facade = inject(RecruiterOperationalInboxFacade);
  protected readonly trainingFacade = inject(RecruiterTrainingGroupsFacade);
  protected readonly form = this.facade.typifyForm;
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(RecruiterPostulantesService);
  private readonly trainingGroupsApi = inject(RecruiterTrainingGroupsService);
  protected readonly meetAgendaOpen = signal(false);
  protected readonly meetDate = signal(this.today());
  protected readonly meetSessions = signal<SesionMeetResponse[]>([]);
  protected readonly meetLoading = signal(false);
  protected readonly meetError = signal('');
  protected readonly trainingGroupsOpen = signal(false);
  protected readonly selectedGroupPostulacionIds = signal<number[]>([]);
  protected readonly selectedTrainingGroupId = signal<number | null>(null);
  protected readonly groupAssignmentState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected readonly groupAssignmentMessage = signal('');
  protected readonly groupAssignmentError = signal('');
  private trainingGroupsInitialized = false;

  protected readonly approvedPendingGroup = computed(() =>
    this.facade.rows().filter(row => row.resultadoEvaluacion === 'APROBADO' && !row.idGrupoCapacitacion)
  );

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleRealtime());
    this.realtime.watchTopic('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.facade.refresh();
        this.trainingFacade.handleRealtime();
      });
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.meetAgendaOpen()) this.loadMeetAgenda(); });
  }

  protected label(value: string | null | undefined): string {
    return this.facade.label(value);
  }

  protected date(value: string | null | undefined): string {
    return this.facade.date(value);
  }

  protected dateTime(value: string | null | undefined): string {
    return this.facade.dateTime(value);
  }

  protected rowStatusClass(value: string | null | undefined): string {
    return (value ?? 'pendiente').toLowerCase().replace(/_/g, '-');
  }

  protected initials(nombres: string, apellidos: string): string {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected saveLabel(): string {
    if (this.facade.actionState() === 'loading') return 'Procesando…';
    if (this.facade.actionState() === 'success') return 'Listo';
    return 'Guardar tipificación';
  }

  protected toggleMeetAgenda(): void {
    this.meetAgendaOpen.update(open => !open);
    if (this.meetAgendaOpen()) this.loadMeetAgenda();
  }

  protected toggleTrainingGroups(): void {
    this.trainingGroupsOpen.update(open => !open);
    if (this.trainingGroupsOpen() && !this.trainingGroupsInitialized) {
      this.trainingGroupsInitialized = true;
      this.trainingFacade.initialize();
    }
  }

  protected toggleGroupPostulacion(id: number): void {
    this.selectedGroupPostulacionIds.update(ids =>
      ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]
    );
    this.groupAssignmentState.set('idle');
    this.groupAssignmentMessage.set('');
    this.groupAssignmentError.set('');
  }

  protected isGroupPostulacionSelected(id: number): boolean {
    return this.selectedGroupPostulacionIds().includes(id);
  }

  protected selectTrainingGroup(id: string): void {
    this.selectedTrainingGroupId.set(Number(id) || null);
    this.groupAssignmentState.set('idle');
    this.groupAssignmentMessage.set('');
    this.groupAssignmentError.set('');
  }

  protected assignSelectedToTrainingGroup(): void {
    const groupId = this.selectedTrainingGroupId();
    const ids = this.selectedGroupPostulacionIds();
    if (!groupId || !ids.length || this.groupAssignmentState() === 'loading') return;

    this.groupAssignmentState.set('loading');
    this.groupAssignmentMessage.set('Asignando postulantes…');
    this.groupAssignmentError.set('');
    this.trainingGroupsApi.asignarPostulaciones(groupId, ids)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.groupAssignmentState.set('success');
          this.groupAssignmentMessage.set(`${ids.length} postulantes asignados al grupo.`);
          this.selectedGroupPostulacionIds.set([]);
          this.selectedTrainingGroupId.set(null);
          this.facade.refresh();
          this.trainingFacade.handleRealtime();
        },
        error: () => {
          this.groupAssignmentState.set('error');
          this.groupAssignmentMessage.set('');
          this.groupAssignmentError.set('No se pudieron asignar los postulantes seleccionados. Verifica que sigan aprobados y sin grupo.');
        }
      });
  }

  protected groupLabel(value: string | null | undefined): string {
    return this.label(value);
  }

  protected groupIdValue(id: number): string {
    return String(id);
  }

  protected changeMeetDate(value: string): void {
    this.meetDate.set(value);
    this.loadMeetAgenda();
  }

  protected loadMeetAgenda(): void {
    this.meetLoading.set(true);
    this.meetError.set('');
    this.api.listarSesionesMeet(this.meetDate()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: sessions => { this.meetSessions.set(sessions); this.meetLoading.set(false); },
      error: () => { this.meetSessions.set([]); this.meetLoading.set(false); this.meetError.set('No se pudo cargar la agenda Meet.'); }
    });
  }

  protected meetHour(session: SesionMeetResponse): string {
    return new Date(session.fechaHoraInicio).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
  }

  private today(): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
