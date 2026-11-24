import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, interval } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { Popover, PopoverModule } from 'primeng/popover';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { RecruiterOperationalInboxFacade } from '../../facades/recruiter-operational-inbox.facade';
import { GestionDrawerComponent } from '../../components/gestion-drawer/gestion-drawer.component';
import { RecruiterPostulantesService } from '../../services/recruiter-postulantes.service';
import { SesionMeetParticipanteResponse, SesionMeetResponse } from '../../../../shared/models/recruitment/sesion-meet-response';
import { MeetAsistencia, MeetEvaluacion, MeetGestionBatchItemRequest } from '../../../../shared/models/recruitment/meet-batch';
import { RecruiterTrainingGroupsFacade } from '../../facades/recruiter-training-groups.facade';
import { RecruiterTrainingGroupsService } from '../../services/recruiter-training-groups.service';
import { TrainingGroupFormPanelComponent } from '../../components/training-group-form-panel/training-group-form-panel.component';
import { CurrentUserRecruitmentNegocioScopeService } from '../../../../core/services/current-user-recruitment-negocio-scope.service';

@Component({
  selector: 'app-recruiter-operational-inbox-page',
  imports: [FormsModule, ReactiveFormsModule, DatePickerModule, PopoverModule, GestionDrawerComponent, TrainingGroupFormPanelComponent],
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
  protected readonly meetCalendarDate = signal(this.parseLocalDate(this.today()));
  protected readonly meetDatePickerOpen = signal(false);
  protected readonly meetSessions = signal<SesionMeetResponse[]>([]);
  protected readonly activeMeetCount = computed(() => this.meetSessions().length);
  protected readonly meetLoading = signal(false);
  protected readonly meetError = signal('');
  protected readonly selectedMeetSessionId = signal<number | null>(null);
  protected readonly meetAttendanceDraft = signal<Record<number, MeetAsistencia | null>>({});
  protected readonly meetEvaluationDraft = signal<Record<number, MeetEvaluacion | null>>({});
  protected readonly meetObservationDraft = signal<Record<number, string>>({});
  protected readonly meetBulkAttendanceSelection = signal<MeetAsistencia | null>(null);
  protected readonly meetBatchState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected readonly meetBatchMessage = signal('');
  private readonly meetClock = signal(Date.now());
  protected readonly trainingGroupsOpen = signal(false);
  protected readonly selectedGroupPostulacionIds = signal<number[]>([]);
  protected readonly selectedTrainingGroupId = signal<number | null>(null);
  protected readonly groupAssignmentState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected readonly groupAssignmentMessage = signal('');
  protected readonly groupAssignmentError = signal('');
  protected readonly createGroupDrawerOpen = signal(false);
  protected readonly meetParticipantDrawerOpen = signal(false);
  protected readonly expandedGroupId = signal<number | null>(null);
  protected readonly movingDetalleId = signal<number | null>(null);
  protected readonly moveDestinoId = signal<number | null>(null);
  protected readonly groupOpBusy = signal(false);
  private trainingGroupsInitialized = false;
  private readonly meetDatePopover = viewChild.required<Popover>('meetDatePopover');

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
      this.loadMeetAgenda();
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
      .subscribe(() => this.loadMeetAgenda());
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.meetClock.set(Date.now()));
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
    if (this.meetAgendaOpen()) this.trainingGroupsOpen.set(false);
    if (this.meetAgendaOpen()) this.loadMeetAgenda();
  }

  protected openMeetAgenda(fechaHora?: string): void {
    this.meetParticipantDrawerOpen.set(false);
    this.facade.closeDrawer();
    const agendaDate = fechaHora ? this.dateInLima(fechaHora) : null;
    if (agendaDate) {
      this.meetDate.set(agendaDate);
      this.meetCalendarDate.set(this.parseLocalDate(agendaDate));
    }
    this.resetMeetSelection();
    this.meetAgendaOpen.set(true);
    this.loadMeetAgenda();
  }

  private dateInLima(value: string): string | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    return year && month && day ? `${year}-${month}-${day}` : null;
  }

  protected toggleTrainingGroups(): void {
    this.trainingGroupsOpen.update(open => !open);
    if (this.trainingGroupsOpen()) this.meetAgendaOpen.set(false);
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

  protected meetDateLabel(): string {
    const selected = this.meetDate();
    if (selected === this.today()) return 'Hoy';
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(this.meetCalendarDate())
      .replace(/\./g, '');
  }

  protected toggleMeetDatePicker(event: MouseEvent): void {
    if (this.meetDatePickerOpen()) {
      this.meetDatePopover().hide();
      return;
    }
    this.meetDatePopover().show(event, event.currentTarget as HTMLElement);
    this.meetDatePickerOpen.set(true);
  }

  protected onMeetDatePopoverHide(): void {
    this.meetDatePickerOpen.set(false);
  }

  protected onMeetDatePopoverShow(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.centerMeetDatePopover());
    });
  }

  protected onMeetDatePicked(value: Date | null): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return;
    this.changeMeetDate(this.formatLocalDate(value));
    this.meetDatePopover().hide();
  }

  protected changeMeetDate(value: string): void {
    this.meetDate.set(value);
    this.meetCalendarDate.set(this.parseLocalDate(value));
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
    this.meetBulkAttendanceSelection.set(null);
  }

  protected isMeetSessionSelected(session: SesionMeetResponse): boolean {
    return this.selectedMeetSessionId() === session.id;
  }

  protected selectedMeet(): SesionMeetResponse | null {
    const id = this.selectedMeetSessionId();
    return id ? this.meetSessions().find(session => session.id === id) ?? null : null;
  }

  protected meetHasStarted(session: SesionMeetResponse): boolean {
    this.meetClock();
    const startsAt = Date.parse(session.fechaHoraInicio);
    return Number.isFinite(startsAt) && startsAt <= Date.now();
  }

  protected meetAvailabilityMessage(session: SesionMeetResponse): string {
    const startsAt = Date.parse(session.fechaHoraInicio);
    if (!Number.isFinite(startsAt)) {
      return 'No se pudo determinar el horario del Meet. Vuelve a cargar la agenda antes de gestionarlo.';
    }
    return `Este Meet aún no inicia. Podrás registrar asistencia y evaluación cuando llegue la hora de las ${this.meetHour(session)}.`;
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

  protected meetParticipantStatusLabel(participant: SesionMeetParticipanteResponse): string {
    const evaluation = this.evaluationValue(participant);
    const attendance = this.attendanceValue(participant);
    if (evaluation === 'APROBADO') return 'Aprobado';
    if (evaluation === 'RECHAZADO') return 'Desaprobado';
    if (attendance === 'ASISTIO') return 'Asistió';
    if (attendance === 'NO_ASISTIO') return 'No asistió';
    return 'Pendiente';
  }

  protected meetParticipantStatusClass(participant: SesionMeetParticipanteResponse): string {
    const evaluation = this.evaluationValue(participant);
    const attendance = this.attendanceValue(participant);
    if (evaluation === 'APROBADO') {
      return 'meet-session__status meet-session__status--positive';
    }
    if (evaluation === 'RECHAZADO' || attendance === 'NO_ASISTIO') {
      return 'meet-session__status meet-session__status--negative';
    }
    if (attendance === 'ASISTIO') {
      return 'meet-session__status meet-session__status--attention';
    }
    return 'meet-session__status';
  }

  protected meetParticipantStatusIcon(participant: SesionMeetParticipanteResponse): string {
    const evaluation = this.evaluationValue(participant);
    const attendance = this.attendanceValue(participant);
    if (evaluation === 'APROBADO') return 'ti-check';
    if (evaluation === 'RECHAZADO' || attendance === 'NO_ASISTIO') return 'ti-x';
    if (attendance === 'ASISTIO') return 'ti-help-circle';
    return 'ti-clock';
  }

  protected meetParticipantActionLabel(participant: SesionMeetParticipanteResponse): string {
    return participant.asistencia === 'NO_ASISTIO' ? 'Programar nuevo Meet' : 'Reprogramar Meet';
  }

  protected openMeetParticipant(participant: SesionMeetParticipanteResponse): void {
    this.meetParticipantDrawerOpen.set(true);
    this.facade.openDetail(participant.postulacion);
  }

  protected closeDetailDrawer(): void {
    this.meetParticipantDrawerOpen.set(false);
    this.facade.closeDrawer();
  }

  protected setMeetAttendance(idPostulacion: number, value: string): void {
    const attendance = value === 'ASISTIO' || value === 'NO_ASISTIO' ? value : null;
    this.meetAttendanceDraft.update(draft => ({ ...draft, [idPostulacion]: attendance }));
    this.meetBulkAttendanceSelection.set(null);
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
    if (!this.meetHasStarted(session)) {
      this.meetBatchState.set('error');
      this.meetBatchMessage.set(this.meetAvailabilityMessage(session));
      return;
    }
    const next = { ...this.meetAttendanceDraft() };
    this.meetParticipants(session).forEach(participant => {
      if (participant.asistencia === 'PENDIENTE') next[participant.idPostulacion] = value;
    });
    this.meetAttendanceDraft.set(next);
    this.meetBulkAttendanceSelection.set(value);
    this.meetBatchState.set('idle');
    this.meetBatchMessage.set('');
  }

  protected submitMeetWorkflow(session: SesionMeetResponse): void {
    if (this.meetBatchState() === 'loading') return;
    if (!this.meetHasStarted(session)) {
      this.meetBatchState.set('error');
      this.meetBatchMessage.set(this.meetAvailabilityMessage(session));
      return;
    }
    const items: MeetGestionBatchItemRequest[] = [];
    const incompleteEvaluations: string[] = [];

    this.meetParticipants(session).forEach(participant => {
      const asistencia = participant.asistencia === 'PENDIENTE' ? this.attendanceValue(participant) : null;
      const evaluacion = participant.resultadoEvaluacion ? null : this.evaluationValue(participant);
      const hasDecision = Boolean(asistencia || evaluacion);
      if (!hasDecision) return;

      const name = this.displayName(participant.postulacion.postulante);
      if (asistencia === 'ASISTIO' && !evaluacion) incompleteEvaluations.push(name);
      if (!asistencia && evaluacion && participant.asistencia !== 'ASISTIO') {
        incompleteEvaluations.push(name);
      }

      const observacion = this.observationValue(participant).trim();
      items.push({
        idPostulacion: participant.idPostulacion,
        asistencia,
        evaluacion,
        motivo: evaluacion,
        observacion,
        revisionEsperada: participant.revision ?? 0
      });
    });

    if (!items.length) {
      this.meetBatchState.set('error');
      this.meetBatchMessage.set('Selecciona la asistencia y la evaluación de al menos un participante.');
      return;
    }
    if (incompleteEvaluations.length) {
      this.meetBatchState.set('error');
      this.meetBatchMessage.set(`Completa la evaluación de: ${incompleteEvaluations.join(', ')}.`);
      return;
    }
    this.meetBatchState.set('loading');
    this.meetBatchMessage.set('');
    const aprobados = items.filter(item => item.evaluacion === 'APROBADO').length;
    this.api.registrarGestionMeetBatch(session.id, this.negocioScope.active(), { items })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.meetBatchState.set('success');
          this.meetBatchMessage.set(
            `${response.procesados} gestión${response.procesados === 1 ? '' : 'es'} guardada${response.procesados === 1 ? '' : 's'}` +
            (aprobados ? `. ${aprobados} aprobado${aprobados === 1 ? '' : 's'} disponible${aprobados === 1 ? '' : 's'} en Grupos de capacitación.` : '.')
          );
          this.meetAttendanceDraft.set({});
          this.meetEvaluationDraft.set({});
          this.meetObservationDraft.set({});
          this.meetBulkAttendanceSelection.set(null);
          this.facade.refresh();
          this.loadMeetAgenda();
        },
        error: error => {
          this.meetBatchState.set('error');
          this.meetBatchMessage.set(error?.error?.message || 'No se pudo guardar la gestión del Meet. La sesión pudo cambiar; vuelve a cargar la agenda.');
        }
      });
  }

  private resetMeetSelection(): void {
    this.selectedMeetSessionId.set(null);
    this.meetAttendanceDraft.set({});
    this.meetEvaluationDraft.set({});
    this.meetObservationDraft.set({});
    this.meetBulkAttendanceSelection.set(null);
    this.meetBatchState.set('idle');
    this.meetBatchMessage.set('');
  }

  protected meetHour(session: SesionMeetResponse): string {
    return new Date(session.fechaHoraInicio).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
  }

  protected meetWorkspaceTitle(session: SesionMeetResponse): string {
    return `MEET - ${this.label(session.negocio).toUpperCase()} - ${this.meetHourTitle(session)}`;
  }

  protected meetHourTitle(session: SesionMeetResponse): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Lima'
    }).format(new Date(session.fechaHoraInicio));
  }

  private today(): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private parseLocalDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatLocalDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private centerMeetDatePopover(): void {
    const popover = this.meetDatePopover() as unknown as { container?: HTMLElement | null };
    const container = popover.container;
    const target = document.querySelector<HTMLElement>('.meet-agenda__date-trigger');
    if (!container || !target) return;

    const margin = 8;
    const targetRect = target.getBoundingClientRect();
    const panelWidth = container.offsetWidth;
    const minLeft = window.scrollX + margin;
    const maxLeft = window.scrollX + window.innerWidth - panelWidth - margin;
    const left = Math.min(
      Math.max(targetRect.left + window.scrollX + targetRect.width / 2 - panelWidth / 2, minLeft),
      maxLeft,
    );
    const topBelow = targetRect.bottom + window.scrollY + margin;
    const topAbove = targetRect.top + window.scrollY - container.offsetHeight - margin;
    const maxBottom = window.scrollY + window.innerHeight - margin;

    container.style.left = `${left}px`;
    container.style.top = `${topBelow + container.offsetHeight <= maxBottom ? topBelow : Math.max(window.scrollY + margin, topAbove)}px`;

    const targetCenter = targetRect.left + window.scrollX + targetRect.width / 2;
    const arrowLeft = targetCenter - left;
    container.style.setProperty('--p-popover-arrow-offset', '0px');
    container.style.setProperty('--p-popover-arrow-left', `${arrowLeft}px`);
  }
}
