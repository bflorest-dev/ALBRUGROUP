import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { RecruiterOperationalInboxFacade } from '../../facades/recruiter-operational-inbox.facade';
import { GestionDrawerComponent } from '../../components/gestion-drawer/gestion-drawer.component';
import { RecruiterPostulantesService } from '../../services/recruiter-postulantes.service';
import { SesionMeetParticipanteResponse, SesionMeetResponse } from '../../../../shared/models/recruitment/sesion-meet-response';
import { MeetAsistencia, MeetEvaluacion } from '../../../../shared/models/recruitment/meet-batch';
import { RecruiterTrainingGroupsFacade } from '../../facades/recruiter-training-groups.facade';
import { RecruiterTrainingGroupsService } from '../../services/recruiter-training-groups.service';
import { TrainingGroupFormPanelComponent } from '../../components/training-group-form-panel/training-group-form-panel.component';
import { CurrentUserRecruitmentNegocioScopeService } from '../../../../core/services/current-user-recruitment-negocio-scope.service';

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
  protected readonly estadoFilterOptions = [
    { value: '', label: 'Todos' },
    { value: 'POSTULANTE', label: 'Por revisar' },
    { value: 'SIN_CONTACTO', label: 'Sin contacto' },
    { value: 'EN_GESTION', label: 'En gestión' },
    { value: 'NO_INTERESADO', label: 'No interesado' },
    { value: 'RECHAZADO', label: 'Rechazado' }
  ] as const;
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(RecruiterPostulantesService);
  private readonly negocioScope = inject(CurrentUserRecruitmentNegocioScopeService);
  private readonly trainingGroupsApi = inject(RecruiterTrainingGroupsService);
  protected readonly meetAgendaOpen = signal(false);
  protected readonly meetDate = signal(this.today());
  protected readonly meetSessions = signal<SesionMeetResponse[]>([]);
  protected readonly meetLoading = signal(false);
  protected readonly meetError = signal('');
  protected readonly selectedMeetSessionId = signal<number | null>(null);
  protected readonly meetAttendanceDraft = signal<Record<number, MeetAsistencia | null>>({});
  protected readonly meetEvaluationDraft = signal<Record<number, MeetEvaluacion | null>>({});
  protected readonly meetObservationDraft = signal<Record<number, string>>({});
  protected readonly meetBatchState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected readonly meetBatchMessage = signal('');
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

  private readonly reloadBusinessScopedPanels = effect(
    () => {
      this.negocioScope.active();
      if (this.meetAgendaOpen()) this.loadMeetAgenda();
      if (this.trainingGroupsOpen()) this.trainingFacade.loadGroups();
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

  protected filterLabel(options: ReadonlyArray<{ value: string; label: string }>, value: string): string {
    return options.find(option => option.value === value)?.label ?? options[0].label;
  }

  protected tipificacionLabel(value: number): string {
    const tipificacion = this.facade.tipificaciones().find(item => item.id === value);
    return value === 0 ? 'Todas' : tipificacion ? this.facade.label(tipificacion.codigo) : 'Todas';
  }

  protected selectEstado(value: string, menu: HTMLDetailsElement): void {
    this.facade.setEstadoFilter(value);
    menu.open = false;
  }

  protected selectTipificacion(value: number, menu: HTMLDetailsElement): void {
    this.facade.setTipificacionFilter(String(value));
    menu.open = false;
  }

  @HostListener('document:click', ['$event'])
  protected closeFilterMenus(event: MouseEvent): void {
    const target = event.target as Node;
    document.querySelectorAll<HTMLDetailsElement>('details.filter-select[open]').forEach(menu => {
      if (!menu.contains(target)) menu.open = false;
    });
  }

  @HostListener('document:keydown.escape')
  protected closeFilterMenusOnEscape(): void {
    document.querySelectorAll<HTMLDetailsElement>('details.filter-select[open]').forEach(menu => menu.open = false);
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
    this.resetMeetSelection();
    this.loadMeetAgenda();
  }

  protected loadMeetAgenda(): void {
    this.meetLoading.set(true);
    this.meetError.set('');
    this.api.listarSesionesMeet(this.meetDate(), this.negocioScope.active()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: sessions => {
        this.meetSessions.set(sessions);
        if (this.selectedMeetSessionId() && !sessions.some(session => session.id === this.selectedMeetSessionId())) {
          this.resetMeetSelection();
        }
        this.meetLoading.set(false);
      },
      error: () => { this.meetSessions.set([]); this.meetLoading.set(false); this.meetError.set('No se pudo cargar la agenda Meet.'); }
    });
  }

  protected selectMeetSession(session: SesionMeetResponse): void {
    this.selectedMeetSessionId.set(session.id);
    this.meetBatchState.set('idle');
    this.meetBatchMessage.set('');
    this.meetAttendanceDraft.set({});
    this.meetEvaluationDraft.set({});
    this.meetObservationDraft.set({});
  }

  protected isMeetSessionSelected(session: SesionMeetResponse): boolean {
    return this.selectedMeetSessionId() === session.id;
  }

  protected selectedMeet(): SesionMeetResponse | null {
    const id = this.selectedMeetSessionId();
    return id ? this.meetSessions().find(session => session.id === id) ?? null : null;
  }

  protected meetParticipants(session: SesionMeetResponse): SesionMeetParticipanteResponse[] {
    if (session.participantes?.length) return session.participantes;
    return session.postulaciones.map(postulacion => ({
      idPostulacion: postulacion.id,
      postulacion,
      asistencia: 'PENDIENTE',
      resultadoEvaluacion: null,
      evaluadaAt: null,
      responsableId: null,
      revision: null
    }));
  }

  protected attendanceValue(participant: SesionMeetParticipanteResponse): MeetAsistencia | null {
    return this.meetAttendanceDraft()[participant.idPostulacion] ??
      (participant.asistencia === 'PENDIENTE' ? null : participant.asistencia);
  }

  protected evaluationValue(participant: SesionMeetParticipanteResponse): MeetEvaluacion | null {
    return this.meetEvaluationDraft()[participant.idPostulacion] ??
      (participant.resultadoEvaluacion === 'APROBADO' || participant.resultadoEvaluacion === 'RECHAZADO'
        ? participant.resultadoEvaluacion
        : null);
  }

  protected observationValue(participant: SesionMeetParticipanteResponse): string {
    return this.meetObservationDraft()[participant.idPostulacion] ?? '';
  }

  protected isParticipantAttended(participant: SesionMeetParticipanteResponse): boolean {
    return this.attendanceValue(participant) === 'ASISTIO';
  }

  protected meetParticipantActionLabel(participant: SesionMeetParticipanteResponse): string {
    return participant.asistencia === 'NO_ASISTIO' ? 'Programar nuevo Meet' : 'Reprogramar Meet';
  }

  protected openMeetParticipant(participant: SesionMeetParticipanteResponse): void {
    this.facade.openDetail(participant.postulacion);
  }

  protected setMeetAttendance(idPostulacion: number, value: string): void {
    const attendance = value === 'ASISTIO' || value === 'NO_ASISTIO' ? value : null;
    this.meetAttendanceDraft.update(draft => ({ ...draft, [idPostulacion]: attendance }));
    this.meetBatchState.set('idle');
    this.meetBatchMessage.set('');
  }

  protected setMeetEvaluation(idPostulacion: number, value: string): void {
    const evaluation = value === 'APROBADO' || value === 'RECHAZADO' ? value : null;
    this.meetEvaluationDraft.update(draft => ({ ...draft, [idPostulacion]: evaluation }));
    this.meetBatchState.set('idle');
    this.meetBatchMessage.set('');
  }

  protected setMeetObservation(idPostulacion: number, value: string): void {
    this.meetObservationDraft.update(draft => ({ ...draft, [idPostulacion]: value }));
  }

  protected markMeetAttendance(session: SesionMeetResponse, value: MeetAsistencia): void {
    const next = { ...this.meetAttendanceDraft() };
    this.meetParticipants(session).forEach(participant => {
      if (participant.asistencia === 'PENDIENTE') next[participant.idPostulacion] = value;
    });
    this.meetAttendanceDraft.set(next);
    this.meetBatchState.set('idle');
    this.meetBatchMessage.set('');
  }

  protected submitMeetAttendance(session: SesionMeetResponse): void {
    if (this.meetBatchState() === 'loading') return;
    const items = this.meetParticipants(session)
      .filter(participant => participant.asistencia === 'PENDIENTE' && this.attendanceValue(participant))
      .map(participant => ({
        idPostulacion: participant.idPostulacion,
        asistencia: this.attendanceValue(participant)!,
        observacion: this.observationValue(participant).trim() || null,
        revisionEsperada: participant.revision
      }));
    if (!items.length) {
      this.meetBatchState.set('error');
      this.meetBatchMessage.set('Selecciona la asistencia de al menos un participante.');
      return;
    }
    this.meetBatchState.set('loading');
    this.meetBatchMessage.set('');
    this.api.registrarAsistenciaMeetBatch(session.id, this.negocioScope.active(), { items })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.meetBatchState.set('success');
          this.meetBatchMessage.set(`${response.procesados} asistencia${response.procesados === 1 ? '' : 's'} registrada${response.procesados === 1 ? '' : 's'}.`);
          this.meetAttendanceDraft.set({});
          this.facade.refresh();
          this.loadMeetAgenda();
        },
        error: error => {
          this.meetBatchState.set('error');
          this.meetBatchMessage.set(error?.error?.message || 'No se pudo registrar la asistencia. La sesión pudo cambiar; vuelve a cargar la agenda.');
        }
      });
  }

  protected submitMeetEvaluation(session: SesionMeetResponse): void {
    if (this.meetBatchState() === 'loading') return;
    const items = this.meetParticipants(session)
      .filter(participant => participant.asistencia === 'ASISTIO' && !participant.resultadoEvaluacion && this.evaluationValue(participant))
      .map(participant => ({
        idPostulacion: participant.idPostulacion,
        resultado: this.evaluationValue(participant)!,
        motivo: this.evaluationValue(participant)!,
        observacion: this.observationValue(participant).trim(),
        revisionEsperada: participant.revision
      }));
    if (!items.length) {
      this.meetBatchState.set('error');
      this.meetBatchMessage.set('Selecciona la evaluación de al menos un participante que asistió.');
      return;
    }
    if (items.some(item => !item.observacion)) {
      this.meetBatchState.set('error');
      this.meetBatchMessage.set('Agrega una observación para cada evaluación seleccionada.');
      return;
    }
    this.meetBatchState.set('loading');
    this.meetBatchMessage.set('');
    this.api.registrarEvaluacionMeetBatch(session.id, this.negocioScope.active(), { items })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.meetBatchState.set('success');
          this.meetBatchMessage.set(`${response.procesados} evaluación${response.procesados === 1 ? '' : 'es'} registrada${response.procesados === 1 ? '' : 's'}.`);
          this.meetEvaluationDraft.set({});
          this.meetObservationDraft.set({});
          this.facade.refresh();
          this.loadMeetAgenda();
        },
        error: error => {
          this.meetBatchState.set('error');
          this.meetBatchMessage.set(error?.error?.message || 'No se pudo registrar la evaluación. La sesión pudo cambiar; vuelve a cargar la agenda.');
        }
      });
  }

  private resetMeetSelection(): void {
    this.selectedMeetSessionId.set(null);
    this.meetAttendanceDraft.set({});
    this.meetEvaluationDraft.set({});
    this.meetObservationDraft.set({});
    this.meetBatchState.set('idle');
    this.meetBatchMessage.set('');
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
