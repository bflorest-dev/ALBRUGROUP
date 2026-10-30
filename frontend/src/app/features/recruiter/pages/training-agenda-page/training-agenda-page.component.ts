import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { GrupoCapacitacionResponse } from '../../../../shared/models/recruitment/grupo-capacitacion-response';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { TrainingGroupFormPanelComponent } from '../../components/training-group-form-panel/training-group-form-panel.component';
import { RecruiterTrainingGroupsFacade } from '../../facades/recruiter-training-groups.facade';
import { RecruiterPostulantesService } from '../../services/recruiter-postulantes.service';
import { RecruiterTrainingGroupsService } from '../../services/recruiter-training-groups.service';

interface ChipView {
  id: number;
  codigo: string;
  estadoClass: string;
  turnoClass: string;
  count: number;
  draggable: boolean;
  nombres: string[];
}

interface DayCell {
  day: number;
  dateStr: string;
  out: boolean;
  today: boolean;
  past: boolean;
  openUp: boolean;
  openLeft: boolean;
  groups: ChipView[];
}

interface MonthView {
  label: string;
  current: boolean;
  cells: DayCell[];
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
const DOW_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

@Component({
  selector: 'app-training-agenda-page',
  imports: [FormsModule, TrainingGroupFormPanelComponent],
  providers: [RecruiterTrainingGroupsFacade],
  templateUrl: './training-agenda-page.component.html',
  styleUrl: './training-agenda-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingAgendaPageComponent implements OnInit {
  protected readonly facade = inject(RecruiterTrainingGroupsFacade);
  private readonly groupsApi = inject(RecruiterTrainingGroupsService);
  private readonly postulantesApi = inject(RecruiterPostulantesService);
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly todayIso = this.iso(new Date());

  protected readonly view = signal(this.firstOfMonth(new Date()));
  protected readonly agenda = signal<GrupoCapacitacionResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMsg = signal('');

  protected readonly selectedGroupId = signal<number | null>(null);
  protected readonly pool = signal<PostulacionResponse[]>([]);
  protected readonly selectedPoolIds = signal<number[]>([]);
  protected readonly movingDetalleId = signal<number | null>(null);
  protected readonly moveDestinoId = signal<number | null>(null);
  protected readonly opBusy = signal(false);
  protected readonly opMsg = signal('');
  protected readonly opError = signal('');

  protected readonly dragGroupId = signal<number | null>(null);
  protected readonly dragOverDate = signal<string | null>(null);
  protected readonly createDrawerOpen = signal(false);
  protected readonly toastMsg = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly months = computed<MonthView[]>(() => {
    const v = this.view();
    return [this.buildMonth(v.getFullYear(), v.getMonth())];
  });

  protected readonly rangeLabel = computed(() => {
    const v = this.view();
    return `${MESES[v.getMonth()]} ${v.getFullYear()}`;
  });

  protected readonly selectedGroup = computed(
    () => this.agenda().find((g) => g.id === this.selectedGroupId()) ?? null
  );

  protected readonly moveTargets = computed(() =>
    this.agenda().filter((g) => g.estado === 'ABIERTO' && g.id !== this.selectedGroupId())
  );

  constructor() {
    // Cierra el drawer de creación y refresca la agenda cuando se crea un grupo.
    effect(
      () => {
        if (this.facade.createSuccessMessage() && this.createDrawerOpen()) {
          this.createDrawerOpen.set(false);
          this.loadAgenda();
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.loadAgenda();
    this.realtime.watchTopic('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }

  // ---- carga ----
  protected loadAgenda(): void {
    const v = this.view();
    const desde = this.iso(new Date(v.getFullYear(), v.getMonth(), 1));
    const hasta = this.iso(new Date(v.getFullYear(), v.getMonth() + 1, 0));
    this.loading.set(true);
    this.errorMsg.set('');
    this.groupsApi.listarAgenda(desde, hasta)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (grupos) => {
          this.agenda.set(grupos);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.errorMsg.set('No fue posible cargar la agenda de capacitación.');
        }
      });
  }

  private refresh(): void {
    this.loadAgenda();
    if (this.selectedGroupId() !== null) {
      this.loadPool();
    }
  }

  private loadPool(): void {
    this.postulantesApi.listarBandejaCapacitacion(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.pool.set(page.content),
        error: () => this.pool.set([])
      });
  }

  // ---- navegación ----
  protected prevMonth(): void {
    const v = this.view();
    this.view.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
    this.loadAgenda();
  }

  protected nextMonth(): void {
    const v = this.view();
    this.view.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
    this.loadAgenda();
  }

  protected goToday(): void {
    this.view.set(this.firstOfMonth(new Date()));
    this.loadAgenda();
  }

  // ---- drag & drop (reprogramar) ----
  protected onDragStart(event: DragEvent, chip: ChipView): void {
    if (!chip.draggable) {
      return;
    }
    this.dragGroupId.set(chip.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected onDragEnd(): void {
    this.dragGroupId.set(null);
    this.dragOverDate.set(null);
  }

  protected onDragOver(event: DragEvent, cell: DayCell): void {
    if (this.dragGroupId() === null || cell.out || cell.past) {
      return;
    }
    event.preventDefault();
    this.dragOverDate.set(cell.dateStr);
  }

  protected onDragLeave(cell: DayCell): void {
    if (this.dragOverDate() === cell.dateStr) {
      this.dragOverDate.set(null);
    }
  }

  protected onDrop(event: DragEvent, cell: DayCell): void {
    event.preventDefault();
    const id = this.dragGroupId();
    this.dragOverDate.set(null);
    this.dragGroupId.set(null);
    if (id === null || cell.out || cell.past || this.opBusy()) {
      return;
    }
    const grupo = this.agenda().find((g) => g.id === id);
    if (!grupo || grupo.fechaInicio === cell.dateStr) {
      return;
    }
    this.opBusy.set(true);
    this.groupsApi.reprogramarGrupo(id, cell.dateStr)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.opBusy.set(false);
          this.toast(`${grupo.codigo}: inicio movido al ${this.fmtLong(cell.dateStr)}.`);
          this.loadAgenda();
        },
        error: () => {
          this.opBusy.set(false);
          this.toast('No se pudo reprogramar el grupo. Debe seguir Abierto.');
        }
      });
  }

  // ---- drawer de gestión ----
  protected openGroup(chip: ChipView): void {
    this.selectedGroupId.set(chip.id);
    this.selectedPoolIds.set([]);
    this.cancelMove();
    this.opMsg.set('');
    this.opError.set('');
    this.loadPool();
  }

  protected closeGroup(): void {
    this.selectedGroupId.set(null);
    this.cancelMove();
  }

  protected togglePool(idPostulacion: number): void {
    this.selectedPoolIds.update((ids) =>
      ids.includes(idPostulacion) ? ids.filter((i) => i !== idPostulacion) : [...ids, idPostulacion]
    );
  }

  protected isPoolSelected(idPostulacion: number): boolean {
    return this.selectedPoolIds().includes(idPostulacion);
  }

  protected assignSelected(): void {
    const groupId = this.selectedGroupId();
    const ids = this.selectedPoolIds();
    if (groupId === null || !ids.length) {
      return;
    }
    this.runOp(
      this.groupsApi.asignarPostulaciones(groupId, ids),
      `${ids.length} postulante${ids.length > 1 ? 's' : ''} asignado${ids.length > 1 ? 's' : ''}.`,
      'No se pudieron asignar los postulantes.',
      () => this.selectedPoolIds.set([])
    );
  }

  protected startMove(detalleId: number): void {
    this.movingDetalleId.set(detalleId);
    this.moveDestinoId.set(null);
  }

  protected setMoveDestino(value: string): void {
    this.moveDestinoId.set(Number(value) || null);
  }

  protected isMoving(detalleId: number): boolean {
    return this.movingDetalleId() === detalleId;
  }

  protected cancelMove(): void {
    this.movingDetalleId.set(null);
    this.moveDestinoId.set(null);
  }

  protected confirmMove(idPostulacion: number): void {
    const origen = this.selectedGroupId();
    const destino = this.moveDestinoId();
    if (origen === null || destino === null) {
      return;
    }
    this.runOp(
      this.groupsApi.trasladarPostulaciones(destino, origen, [idPostulacion]),
      'Postulante trasladado.',
      'No se pudo mover al postulante. Ambos grupos deben estar Abiertos.',
      () => this.cancelMove()
    );
  }

  protected retire(idPostulacion: number): void {
    const groupId = this.selectedGroupId();
    if (groupId === null) {
      return;
    }
    this.runOp(
      this.groupsApi.retirarPostulacion(groupId, idPostulacion),
      'Postulante retirado · vuelve a aprobados sin grupo.',
      'No se pudo retirar al postulante. El grupo debe estar Abierto.'
    );
  }

  private runOp(
    operation: Observable<unknown>,
    successMessage: string,
    errorMessage: string,
    onSuccess?: () => void
  ): void {
    this.opBusy.set(true);
    this.opMsg.set('');
    this.opError.set('');
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.opBusy.set(false);
        this.opMsg.set(successMessage);
        onSuccess?.();
        this.loadAgenda();
        this.loadPool();
      },
      error: () => {
        this.opBusy.set(false);
        this.opError.set(errorMessage);
      }
    });
  }

  // ---- crear grupo ----
  protected openCreateDrawer(): void {
    this.facade.createSuccessMessage.set('');
    this.facade.createErrorMessage.set('');
    this.createDrawerOpen.set(true);
  }

  protected closeCreateDrawer(): void {
    this.createDrawerOpen.set(false);
  }

  // ---- helpers de presentación ----
  protected capacitadorNombre(id: number | null | undefined): string {
    return this.facade.capacitadorNombre(id);
  }

  protected estadoLabel(estado: string): string {
    switch (estado) {
      case 'ABIERTO': return 'Abierto';
      case 'EN_CURSO': return 'En curso';
      case 'CERRADO': return 'Cerrado';
      case 'ANULADO': return 'Anulado';
      default: return this.label(estado);
    }
  }

  protected estadoClass(estado: string): string {
    switch (estado) {
      case 'ABIERTO': return 'abierto';
      case 'EN_CURSO': return 'curso';
      case 'CERRADO': return 'cerrado';
      case 'ANULADO': return 'anulado';
      default: return 'cerrado';
    }
  }

  protected turnoLabel(turno: string): string {
    switch (turno) {
      case 'MORNING': return 'Mañana';
      case 'AFTERNOON': return 'Tarde';
      case 'NIGHT': return 'Noche';
      default: return this.label(turno);
    }
  }

  protected label(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  protected nombreCompleto(postulacion: PostulacionResponse): string {
    const p = postulacion.postulante;
    return `${p.nombres} ${p.apellidos}`.trim();
  }

  protected iniciales(postulacion: PostulacionResponse): string {
    const p = postulacion.postulante;
    return `${p.nombres.charAt(0)}${p.apellidos.charAt(0)}`.toUpperCase();
  }

  protected fmtLong(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return `${DOW_CORTO[date.getDay()]} ${d} ${MESES[m - 1].slice(0, 3)} ${y}`;
  }

  // ---- construcción del calendario ----
  private buildMonth(year: number, month: number): MonthView {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // lunes = 0
    const start = new Date(first);
    start.setDate(1 - startDow);

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = this.iso(d);
      const out = d.getMonth() !== month;
      cells.push({
        day: d.getDate(),
        dateStr,
        out,
        today: !out && dateStr === this.todayIso,
        past: !out && dateStr < this.todayIso,
        openUp: Math.floor(i / 7) >= 4,
        openLeft: (i % 7) >= 5,
        groups: out ? [] : this.chipsOn(dateStr)
      });
    }

    const now = new Date();
    return {
      label: `${MESES[month]} ${year}`,
      current: year === now.getFullYear() && month === now.getMonth(),
      cells
    };
  }

  private chipsOn(dateStr: string): ChipView[] {
    return this.agenda()
      .filter((g) => g.fechaInicio === dateStr)
      .sort((a, b) => a.turno.localeCompare(b.turno))
      .map((g) => this.toChip(g));
  }

  private toChip(g: GrupoCapacitacionResponse): ChipView {
    const nombres = (g.detalles ?? [])
      .map((d) => this.nombreCompleto(d.postulacion))
      .sort((a, b) => a.localeCompare(b, 'es'));
    return {
      id: g.id,
      codigo: g.codigo,
      estadoClass: this.estadoClass(g.estado),
      turnoClass: g.turno === 'AFTERNOON' ? 't' : g.turno === 'NIGHT' ? 'n' : '',
      count: g.detalles?.length ?? 0,
      draggable: g.estado === 'ABIERTO',
      nombres
    };
  }

  private firstOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private iso(d: Date): string {
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private toast(message: string): void {
    this.toastMsg.set(message);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), 2600);
  }
}
