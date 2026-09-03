import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import type { CumplimientoDetalleDiaResponse, OrigenTramo } from '../../../../../shared/models/schedule/cumplimiento-response';
import type { TipoDiaNoLaborable } from '../../../../../shared/models/schedule/dia-no-laborable-request';
import type { RazonAjuste } from '../../../../../shared/models/schedule/jornada-efectiva-response';
import { AttendanceDayReportComponent } from '../../components/attendance-day-report/attendance-day-report.component';
import { AttendanceFilterBarComponent } from '../../components/attendance-filter-bar/attendance-filter-bar.component';
import { AttendanceMetricCardsComponent } from '../../components/attendance-metric-cards/attendance-metric-cards.component';
import { AttendanceMonthHeatmapComponent } from '../../components/attendance-month-heatmap/attendance-month-heatmap.component';
import { AttendanceTrayComponent } from '../../components/attendance-tray/attendance-tray.component';
import { ScheduleWeekEditorComponent } from '../../../../../shared/components/schedule-week-editor/schedule-week-editor.component';
import { ScheduleExtensionTimelineComponent } from '../../../../../shared/components/schedule-extension-timeline/schedule-extension-timeline.component';
import { ScheduleShiftEditorComponent } from '../../../../../shared/components/schedule-shift-editor/schedule-shift-editor.component';
import { SessionService } from '../../../../../core/services/session.service';
import { AjusteJornadaRequest, RegistrarAjusteV2Request } from '../../../../../shared/models/schedule/jornada-efectiva-response';
import {
  CumplimientoRow,
  DrawerTab,
  MonthOption,
  RrhhAsistenciaFacade,
  RrhhAsistenciaSection
} from '../../facades/rrhh-asistencia.facade';

interface SelectChoice {
  label: string;
  value: string;
}

/** Operación de ajuste del día seleccionada para el editor inline. */
type AdjustmentOp = 'extra' | 'compensacion' | 'corrimiento' | 'jornada-extra' | 'compensar-falta' | 'dia-libre';

@Component({
  selector: 'app-rrhh-asistencia-page',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    AttendanceDayReportComponent,
    AttendanceFilterBarComponent,
    AttendanceMetricCardsComponent,
    AttendanceMonthHeatmapComponent,
    AttendanceTrayComponent,
    ScheduleWeekEditorComponent,
    ScheduleExtensionTimelineComponent,
    ScheduleShiftEditorComponent,
    SelectModule,
    TableModule,
    TabsModule,
    TagModule
  ],
  providers: [RrhhAsistenciaFacade],
  templateUrl: './rrhh-asistencia-page.component.html',
  styleUrl: './rrhh-asistencia-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhAsistenciaPageComponent implements OnInit {
  protected readonly facade = inject(RrhhAsistenciaFacade);
  private readonly session = inject(SessionService);

  /** ADMIN puede correr con déficit (compensable); ADMIN y RRHH pueden justificar. */
  protected readonly canCorrimientoCompensable = computed(() =>
    (this.session.session()?.roles ?? []).includes('ADMINISTRADOR')
  );
  protected readonly canCorrimientoJustificada = computed(() => {
    const roles = this.session.session()?.roles ?? [];
    return roles.includes('ADMINISTRADOR') || roles.includes('RRHH');
  });

  // Caches para no devolver refs nuevas desde el template (primeng-loop-fix.md).
  private readonly monthChoicesCache = new Map<readonly MonthOption[], SelectChoice[]>();
  private readonly puestoChoicesCache = new Map<readonly string[], SelectChoice[]>();
  private readonly pickerDateCache = new Map<string, Date | null>();

  protected readonly monthSelectChoices = computed<SelectChoice[]>(() => {
    const options = this.facade.monthOptions;
    let cached = this.monthChoicesCache.get(options);
    if (!cached) {
      cached = options.map((opt) => ({ label: opt.label, value: opt.value }));
      this.monthChoicesCache.set(options, cached);
    }
    return cached;
  });

  protected readonly puestoSelectChoices = computed<SelectChoice[]>(() => {
    const options = this.facade.puestoOptions();
    let cached = this.puestoChoicesCache.get(options);
    if (!cached) {
      cached = [
        { label: 'Todos los puestos', value: '' },
        ...options.map((p) => ({ label: this.formatPuesto(p), value: p }))
      ];
      this.puestoChoicesCache.set(options, cached);
    }
    return cached;
  });

  ngOnInit(): void {
    void this.facade.recargar();
  }

  protected onSectionChange(value: string | number | undefined): void {
    if (value === undefined) return;
    this.facade.setActiveSection(value as RrhhAsistenciaSection);
  }

  protected onDrawerTabChange(value: string | number | undefined): void {
    if (value === undefined) return;
    this.facade.setDrawerTab(value as DrawerTab);
  }

  protected onMonthChange(value: string): void {
    this.facade.setSelectedMonth(value);
  }

  protected onPuestoChange(value: string): void {
    this.facade.setPuestoFilter(value ?? '');
  }

  protected onSearchChange(value: string): void {
    this.facade.setSearchTerm(value);
  }

  protected openDrawer(row: CumplimientoRow): void {
    void this.facade.openEmployeeDrawer(row.idEmpleado);
  }

  /** Claves de fila expandida para el p-table (un solo día abierto a la vez). */
  protected readonly drawerExpandedKeys = computed<Record<string, boolean>>(() => {
    const dia = this.facade.expandedDay();
    return dia ? { [dia]: true } : {};
  });

  protected toggleDay(fecha: string): void {
    void this.facade.toggleDayReport(fecha);
  }

  protected formatPuesto(value: string): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  protected balanceLabel(minutes: number): string {
    if (minutes === 0) return '0 h';
    const sign = minutes > 0 ? '+' : '-';
    const abs = Math.abs(minutes);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (h === 0) return `${sign}${m} min`;
    if (m === 0) return `${sign}${h} h`;
    return `${sign}${h} h ${m} min`;
  }

  protected balanceSeverity(minutes: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (minutes === 0) return 'secondary';
    if (minutes < -120) return 'danger';
    if (minutes < 0) return 'warn';
    return 'success';
  }

  protected faltasSeverity(value: number): 'success' | 'warn' | 'danger' | 'secondary' {
    if (value === 0) return 'secondary';
    if (value >= 3) return 'danger';
    return 'warn';
  }

  protected tardanzasSeverity(value: number): 'success' | 'warn' | 'danger' | 'secondary' {
    if (value === 0) return 'secondary';
    if (value >= 4) return 'danger';
    return 'warn';
  }

  protected monthStatusLabel(): string {
    const status = this.facade.monthStatus();
    if (status === 'cerrado') return 'Mes cerrado';
    if (status === 'futuro') return 'Mes futuro';
    const progress = this.facade.monthProgress();
    if (!progress) return 'En curso';
    return `En curso · día ${progress.day} de ${progress.total}`;
  }

  protected monthStatusSeverity(): 'success' | 'warn' | 'info' {
    const status = this.facade.monthStatus();
    if (status === 'cerrado') return 'success';
    if (status === 'futuro') return 'info';
    return 'warn';
  }

  // ── Drawer helpers
  protected horarioVigenteSummary(): string {
    const h = this.facade.drawerHorario();
    if (!h) return '';
    const labor = h.detalles.filter((d) => d.laborable);
    const descanso = h.detalles.find((d) => !d.laborable)?.dia ?? 'DOMINGO';
    const horas = labor[0];
    if (!horas) return `Descanso ${descanso.toLowerCase()}`;
    return `${horas.horaEntrada} – ${horas.horaSalida} · descansa ${descanso.toLowerCase()}`;
  }

  protected dayStateLabel(dia: { fecha: string; laborable: boolean; horaEntradaEstablecida: string | null; horaEntradaAsistencia: string | null; tardanza: boolean; jornadaCerrada: boolean; minutosTrabajados: number }): string {
    if (!dia.laborable) return 'Libre';
    if (!dia.horaEntradaAsistencia && this.isPendingToday(dia)) return 'Pendiente';
    if (!dia.horaEntradaAsistencia) return 'Falta';
    if (dia.tardanza) return 'Tardanza';
    return 'Presente';
  }

  protected dayStateSeverity(dia: { fecha: string; laborable: boolean; horaEntradaEstablecida: string | null; horaEntradaAsistencia: string | null; tardanza: boolean; jornadaCerrada: boolean }): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    if (!dia.laborable) return 'info';
    if (!dia.horaEntradaAsistencia && this.isPendingToday(dia)) return 'warn';
    if (!dia.horaEntradaAsistencia) return 'danger';
    if (dia.tardanza) return 'warn';
    return 'success';
  }

  protected dayStateClass(dia: { fecha: string; horaEntradaEstablecida: string | null; horaEntradaAsistencia: string | null }): string | undefined {
    return !dia.horaEntradaAsistencia && this.isPendingToday(dia) ? 'day-state-tag--pending' : undefined;
  }

  private isPendingToday(dia: { fecha: string; horaEntradaEstablecida: string | null }): boolean {
    if (!dia.horaEntradaEstablecida || dia.fecha !== this.todayValue()) return false;
    return this.currentMinutesOfDay() < this.timeStringToMinutes(dia.horaEntradaEstablecida);
  }

  protected formatDate(value: string | null): string {
    if (!value) return '—';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}`;
  }

  protected formatTime(value: string | null): string {
    return value ? value.slice(0, 5) : '—';
  }

  /** El día tiene horas extra registradas → badge "+ Extra" en la fila. */
  protected dayHasExtra(d: CumplimientoDetalleDiaResponse): boolean {
    return (d.minutosExtra ?? 0) > 0;
  }

  /** El día tiene horas de compensación registradas → badge "+ Comp" en la fila. */
  protected dayHasComp(d: CumplimientoDetalleDiaResponse): boolean {
    return (d.minutosCompensados ?? 0) > 0;
  }

  protected segmentOriginLabel(origen: OrigenTramo): string {
    const labels: Record<OrigenTramo, string> = {
      BASE: 'Horario base',
      AMPLIACION: 'Ampliacion anterior',
      REEMPLAZO_BASE: 'Horario ajustado',
      JORNADA_EXTRAORDINARIA: 'Jornada extraordinaria',
      TRAMO_ADICIONAL: 'Tramo adicional'
    };
    return labels[origen] ?? 'Tramo de trabajo';
  }

  protected workedTimeLabel(minutes: number): string {
    if (!minutes) return 'Sin tiempo registrado';
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (hours === 0) return `${remainder} min`;
    if (remainder === 0) return `${hours} h`;
    return `${hours} h ${remainder} min`;
  }

  // ── Datepicker helpers (cache contra el loop PrimeNG)
  protected toPickerDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value !== 'string' || !value) return null;
    const cached = this.pickerDateCache.get(value);
    if (cached !== undefined) return cached;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const parsed = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
    this.pickerDateCache.set(value, parsed);
    return parsed;
  }

  private toBackendDate(value: Date | string | null): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const m = `${value.getMonth() + 1}`.padStart(2, '0');
      const d = `${value.getDate()}`.padStart(2, '0');
      return `${value.getFullYear()}-${m}-${d}`;
    }
    return typeof value === 'string' ? value : '';
  }

  private readonly todayDateCached = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  protected todayDate(): Date { return this.todayDateCached; }

  private todayValue(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private currentMinutesOfDay(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private timeStringToMinutes(value: string): number {
    const [hoursRaw, minutesRaw] = value.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  }

  protected setScheduleStartDate(value: Date | string | null): void {
    const formatted = this.toBackendDate(value);
    this.facade.horarioForm.controls.fechaInicio.setValue(formatted);
    this.facade.horarioForm.controls.fechaInicio.markAsTouched();
    this.facade.horarioForm.controls.fechaInicio.markAsDirty();
  }

  protected setCorrectionCustomDate(value: Date | string | null): void {
    this.facade.setCorrectionDecisionCustomDate(this.toBackendDate(value));
  }

  // ── Sección "Hoy"
  protected atrasoLabel(min: number): string {
    if (min <= 0) return '—';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  protected atrasoSeverity(min: number): 'success' | 'warn' | 'danger' | 'secondary' {
    if (min <= 0) return 'secondary';
    if (min >= 60) return 'danger';
    return 'warn';
  }

  // ── Ajustes del día (horas extra / compensación / corrimiento)
  /** Operación abierta como editor inline dentro del drawer (null = lista de accesos). */
  protected readonly activeAdjustment = signal<AdjustmentOp | null>(null);

  constructor() {
    // Al cambiar de empleado (o cerrar el drawer) se vuelve a la lista de accesos, no al editor previo.
    effect(() => {
      this.facade.drawerEmpleado();
      untracked(() => this.activeAdjustment.set(null));
    });
  }

  protected usesLunchBreak(): boolean {
    const modalidad = this.facade.drawerContrato()?.modalidad;
    return modalidad !== 'PART_TIME' && modalidad !== 'SEMI_FULL';
  }

  /** El empleado debe horas este mes → habilita "Compensar". */
  protected debeHoras(): boolean {
    return this.facade.drawerKpis().balanceMin < 0;
  }

  /** Etiqueta del déficit para el badge de "Compensar" (p. ej. "Debe 51 min"). */
  protected deficitBadge(): string {
    const min = Math.abs(Math.min(this.facade.drawerKpis().balanceMin, 0));
    if (min === 0) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    const t = h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
    return `Debe ${t}`;
  }

  /** Hora de ingreso marcada HOY (o null). El corrimiento solo se permite antes de la marca. */
  protected marcaIngresoHoy(): string | null {
    const dia = this.facade.drawerDetalleDias().find((d) => d.fecha === this.todayValue());
    return dia?.horaEntradaAsistencia ? dia.horaEntradaAsistencia.slice(0, 5) : null;
  }

  /** Día del ajuste (horas extra / compensación). Por defecto hoy; acotado al mes del drawer. */
  protected readonly adjustmentDay = signal(this.todayValue());

  protected readonly adjustmentMonthBounds = computed(() => {
    const [y, mo] = this.facade.drawerSelectedMonth().split('-').map(Number);
    const last = new Date(y, mo, 0).getDate();
    return { min: `${this.facade.drawerSelectedMonth()}-01`, max: `${this.facade.drawerSelectedMonth()}-${String(last).padStart(2, '0')}` };
  });

  /** Déficit del mes en minutos (positivo): tope del timeline de compensación. */
  protected readonly deficitMin = computed(() => Math.abs(Math.min(this.facade.drawerKpis().balanceMin, 0)));

  /** Hoy es un día libre para el empleado (descanso/feriado). */
  protected readonly hoyEsDiaLibre = computed(() => {
    const dia = this.facade.drawerDetalleDias().find((d) => d.fecha === this.todayValue());
    return dia ? !dia.laborable : false;
  });

  /** El empleado tiene faltas registradas este mes. */
  protected readonly tieneFaltas = computed(() => this.facade.drawerKpis().faltas > 0);

  /** Fechas de faltas del mes (dd/MM). */
  protected readonly faltasDates = computed(() => {
    const hoy = this.todayValue();
    return this.facade.drawerDetalleDias()
      .filter((d) => d.laborable && !d.horaEntradaAsistencia && d.fecha < hoy)
      .map((d) => {
        const [, m, day] = d.fecha.split('-');
        return `${day}/${m}`;
      });
  });

  private static readonly DAY_NAME_TO_JS: Record<string, number> = {
    DOMINGO: 0, LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6
  };

  /** Días de la semana laborables (JS number: 0=Dom..6=Sáb) — para deshabilitar en el datepicker de compensar-falta. */
  protected readonly diasLaborablesSemana = computed<number[]>(() => {
    const h = this.facade.drawerHorario();
    if (!h) return [1, 2, 3, 4, 5, 6];
    return h.detalles
      .filter((d) => d.laborable)
      .map((d) => RrhhAsistenciaPageComponent.DAY_NAME_TO_JS[d.dia] ?? -1)
      .filter((n) => n >= 0);
  });

  /** Hora de entrada/salida base del horario (primer día laborable). */
  protected readonly horarioBaseHoras = computed(() => {
    const h = this.facade.drawerHorario();
    if (!h) return { entrada: '09:00', salida: '18:00' };
    const labor = h.detalles.find((d) => d.laborable);
    return {
      entrada: labor?.horaEntrada ?? '09:00',
      salida: labor?.horaSalida ?? '18:00'
    };
  });

  // Signals para el editor de jornada extraordinaria
  protected readonly jornadaExtraEntrada = signal('09:00');
  protected readonly jornadaExtraSalida = signal('18:00');
  protected readonly jornadaExtraMotivo = signal('');

  // Signal para el datepicker de compensar-falta (Date porque PrimeNG lo requiere)
  protected readonly compensarFaltaFecha = signal<Date | null>(null);

  // Signals para el editor de día libre
  protected readonly diaLibreFecha = signal('');
  protected readonly diaLibreGlobal = signal(false);
  protected readonly diaLibreTipo = signal<TipoDiaNoLaborable>('FERIADO');
  protected readonly diaLibreMotivo = signal('');

  protected readonly tipoDiaNoLaborableOptions: { label: string; value: TipoDiaNoLaborable }[] = [
    { label: 'Feriado', value: 'FERIADO' },
    { label: 'Vacaciones', value: 'VACACIONES' },
    { label: 'Permiso', value: 'PERMISO' },
    { label: 'Descanso', value: 'DESCANSO_EQUIPO' }
  ];

  protected readonly alcanceOptions: { label: string; value: boolean }[] = [
    { label: 'Solo este empleado', value: false },
    { label: 'Para todos', value: true }
  ];

  protected openAdjustment(op: AdjustmentOp): void {
    this.activeAdjustment.set(op);
    if (op === 'extra' || op === 'compensacion') {
      void this.facade.openDayAdjustment(this.clampDayToMonth(this.adjustmentDay()));
    } else if (op === 'jornada-extra') {
      const base = this.horarioBaseHoras();
      this.jornadaExtraEntrada.set(base.entrada);
      this.jornadaExtraSalida.set(base.salida);
      this.jornadaExtraMotivo.set('');
      void this.facade.openDayAdjustment(this.clampDayToMonth(this.adjustmentDay()));
    } else if (op === 'compensar-falta') {
      const base = this.horarioBaseHoras();
      this.jornadaExtraEntrada.set(base.entrada);
      this.jornadaExtraSalida.set(base.salida);
      this.jornadaExtraMotivo.set('Compensación de falta');
      this.compensarFaltaFecha.set(null);
      void this.facade.openDayAdjustment(this.clampDayToMonth(this.adjustmentDay()));
    } else if (op === 'dia-libre') {
      this.diaLibreFecha.set(this.todayValue());
      this.diaLibreGlobal.set(false);
      this.diaLibreTipo.set('FERIADO');
      this.diaLibreMotivo.set('');
    } else {
      void this.facade.openDayAdjustment(this.todayValue());
    }
  }

  protected onAdjustmentDayChange(value: Date | string | null): void {
    const iso = this.toBackendDate(value);
    if (!iso) return;
    this.adjustmentDay.set(iso);
    void this.facade.openDayAdjustment(iso);
  }

  protected adjustmentDayMinDate(): Date | null {
    return this.toPickerDate(this.adjustmentMonthBounds().min);
  }

  protected adjustmentDayMaxDate(): Date | null {
    return this.toPickerDate(this.adjustmentMonthBounds().max);
  }

  protected async onSaveExtra(requests: AjusteJornadaRequest[]): Promise<void> {
    const ok = await this.facade.submitDayExtension(requests, 'AMPLIACION_OPERATIVA');
    if (ok) this.closeAdjustment();
  }

  protected async onSaveCompensacion(requests: AjusteJornadaRequest[]): Promise<void> {
    const ok = await this.facade.submitDayExtension(requests, 'COMPENSACION');
    if (ok) this.closeAdjustment();
  }

  protected async onSaveCorrimiento(request: RegistrarAjusteV2Request): Promise<void> {
    const ok = await this.facade.submitCorrimiento(request);
    if (ok) this.closeAdjustment();
  }

  private clampDayToMonth(day: string): string {
    const bounds = this.adjustmentMonthBounds();
    if (day < bounds.min) return bounds.min;
    if (day > bounds.max) return bounds.max;
    return day;
  }

  protected closeAdjustment(): void {
    this.activeAdjustment.set(null);
  }

  protected adjustmentTitle(op: AdjustmentOp): string {
    if (op === 'extra') return 'Agregar horas extra';
    if (op === 'compensacion') return 'Compensar horas';
    if (op === 'jornada-extra') return 'Habilitar jornada en día libre';
    if (op === 'compensar-falta') return 'Compensar falta con día libre';
    if (op === 'dia-libre') return 'Declarar día libre';
    return 'Correr horario (tardanza)';
  }

  protected async onSaveJornadaExtra(razon: RazonAjuste): Promise<void> {
    const fecha = this.adjustmentDay();
    const ok = await this.facade.submitJornadaExtraordinaria(
      fecha, this.jornadaExtraEntrada(), this.jornadaExtraSalida(),
      this.jornadaExtraMotivo() || 'Jornada extraordinaria', razon
    );
    if (ok) this.closeAdjustment();
  }

  protected async onSaveDiaLibre(): Promise<void> {
    const ok = await this.facade.submitDiaLibre(
      this.diaLibreFecha(), this.diaLibreTipo(),
      this.diaLibreMotivo() || 'Día libre declarado', this.diaLibreGlobal()
    );
    if (ok) this.closeAdjustment();
  }

  protected onCompensarFaltaFechaChange(value: Date | null): void {
    this.compensarFaltaFecha.set(value);
    if (value) {
      this.adjustmentDay.set(this.toBackendDate(value));
      void this.facade.openDayAdjustment(this.toBackendDate(value));
    }
  }

  protected async onSaveCompensarFalta(): Promise<void> {
    const fecha = this.toBackendDate(this.compensarFaltaFecha());
    if (!fecha) return;
    const ok = await this.facade.submitJornadaExtraordinaria(
      fecha, this.jornadaExtraEntrada(), this.jornadaExtraSalida(),
      this.jornadaExtraMotivo() || 'Compensación de falta', 'COMPENSACION'
    );
    if (ok) this.closeAdjustment();
  }

  protected onDiaLibreFechaChange(value: Date | string | null): void {
    this.diaLibreFecha.set(this.toBackendDate(value));
  }
}
