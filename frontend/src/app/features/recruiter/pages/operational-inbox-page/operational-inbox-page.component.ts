import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
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
  protected readonly createGroupDrawerOpen = signal(false);
  protected readonly expandedGroupId = signal<number | null>(null);
  protected readonly movingDetalleId = signal<number | null>(null);
  protected readonly moveDestinoId = signal<number | null>(null);
  protected readonly groupOpBusy = signal(false);
  private trainingGroupsInitialized = false;

  private readonly closeDrawerOnCreate = effect(
    () => {
      if (this.trainingFacade.createSuccessMessage() && this.createGroupDrawerOpen()) {
        this.createGroupDrawerOpen.set(false);
      }
    },
    { allowSignalWrites: true }
  );

  protected readonly approvedPendingGroup = computed(() =>
    this.facade.trainingRows().filter(row => row.resultadoEvaluacion === 'APROBADO' && !row.idGrupoCapacitacion)
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

  protected initials(nombres?: string | null, apellidos?: string | null, usuarioMeta?: string | null): string {
    const first = nombres?.trim()?.[0] ?? '';
    const last = apellidos?.trim()?.[0] ?? '';
    const meta = usuarioMeta?.replace(/^@+/, '').trim();
    return (first + last || meta?.slice(0, 2) || '?').toUpperCase();
  }

  protected displayName(postulante: { nombres?: string | null; apellidos?: string | null; usuarioMeta?: string | null }): string {
    const name = [postulante.nombres, postulante.apellidos].filter(Boolean).join(' ').trim();
    return name || (postulante.usuarioMeta ? `@${postulante.usuarioMeta.replace(/^@+/, '')}` : 'Postulante sin nombre');
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

  protected selectTrainingGroup(value: string): void {
    this.selectedTrainingGroupId.set(Number(value) || null);
    this.groupAssignmentState.set('idle');
    this.groupAssignmentMessage.set('');
    this.groupAssignmentError.set('');
  }

  protected openCreateDrawer(): void {
    this.trainingFacade.createSuccessMessage.set('');
    this.trainingFacade.createErrorMessage.set('');
    this.createGroupDrawerOpen.set(true);
  }

  protected closeCreateDrawer(): void {
    this.createGroupDrawerOpen.set(false);
  }

  protected toggleGroupExpanded(id: number): void {
    this.expandedGroupId.update(current => (current === id ? null : id));
    this.cancelMove();
  }

  protected assignSelectedToGroup(groupId: number): void {
    const ids = this.selectedGroupPostulacionIds();
    if (!ids.length || this.groupOpBusy()) return;
    this.runGroupOp(
      this.trainingGroupsApi.asignarPostulaciones(groupId, ids),
      `${ids.length} postulante${ids.length > 1 ? 's' : ''} asignado${ids.length > 1 ? 's' : ''} al grupo.`,
      'No se pudieron asignar los postulantes. Verifica que sigan aprobados y sin grupo.',
      () => this.selectedGroupPostulacionIds.set([])
    );
  }

  protected startMove(detalleId: number): void {
    this.movingDetalleId.set(detalleId);
    this.moveDestinoId.set(null);
  }

  protected setMoveDestino(value: string): void {
    this.moveDestinoId.set(Number(value) || null);
  }

  protected cancelMove(): void {
    this.movingDetalleId.set(null);
    this.moveDestinoId.set(null);
  }

  protected isMoving(detalleId: number): boolean {
    return this.movingDetalleId() === detalleId;
  }

  protected confirmMove(idGrupoOrigen: number, idPostulacion: number): void {
    const destino = this.moveDestinoId();
    if (!destino || this.groupOpBusy()) return;
    this.runGroupOp(
      this.trainingGroupsApi.trasladarPostulaciones(destino, idGrupoOrigen, [idPostulacion]),
      'Postulante trasladado al nuevo grupo.',
      'No se pudo mover al postulante. Revisa que ambos grupos sigan abiertos.',
      () => {
        this.cancelMove();
        this.expandedGroupId.set(destino);
      }
    );
  }

  protected retirarMiembro(idGrupoCapacitacion: number, idPostulacion: number): void {
    if (this.groupOpBusy()) return;
    this.runGroupOp(
      this.trainingGroupsApi.retirarPostulacion(idGrupoCapacitacion, idPostulacion),
      'Postulante retirado · vuelve a aprobados sin grupo.',
      'No se pudo retirar al postulante. El grupo debe seguir abierto.'
    );
  }

  private runGroupOp(
    operation: Observable<unknown>,
    successMessage: string,
    errorMessage: string,
    onSuccess?: () => void
  ): void {
    this.groupOpBusy.set(true);
    this.groupAssignmentMessage.set('');
    this.groupAssignmentError.set('');
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.groupOpBusy.set(false);
        this.groupAssignmentMessage.set(successMessage);
        onSuccess?.();
        this.facade.refresh();
        this.trainingFacade.handleRealtime();
      },
      error: () => {
        this.groupOpBusy.set(false);
        this.groupAssignmentError.set(errorMessage);
      }
    });
  }

  protected groupLabel(value: string | null | undefined): string {
    return this.label(value);
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
