import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
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
import type { OrigenTramo } from '../../../../../shared/models/schedule/cumplimiento-response';
import { ScheduleAdjustmentDialogComponent } from '../../../../../shared/components/schedule-adjustment-dialog/schedule-adjustment-dialog.component';
import { AttendanceFilterBarComponent } from '../../components/attendance-filter-bar/attendance-filter-bar.component';
import { AttendanceMetricCardsComponent } from '../../components/attendance-metric-cards/attendance-metric-cards.component';
import { AttendanceMonthHeatmapComponent } from '../../components/attendance-month-heatmap/attendance-month-heatmap.component';
import { AttendanceTrayComponent } from '../../components/attendance-tray/attendance-tray.component';
import { ScheduleEditorPanelComponent } from '../../components/schedule-editor-panel/schedule-editor-panel.component';
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
    ScheduleAdjustmentDialogComponent,
    AttendanceFilterBarComponent,
    AttendanceMetricCardsComponent,
    AttendanceMonthHeatmapComponent,
    AttendanceTrayComponent,
    ScheduleEditorPanelComponent,
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

  protected dayStateLabel(dia: { laborable: boolean; horaEntradaAsistencia: string | null; tardanza: boolean; jornadaCerrada: boolean; minutosTrabajados: number }): string {
    if (!dia.laborable) return 'Libre';
    if (!dia.horaEntradaAsistencia) return 'Falta';
    if (dia.tardanza) return 'Tardanza';
    return 'Presente';
  }

  protected dayStateSeverity(dia: { laborable: boolean; horaEntradaAsistencia: string | null; tardanza: boolean; jornadaCerrada: boolean }): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    if (!dia.laborable) return 'info';
    if (!dia.horaEntradaAsistencia) return 'danger';
    if (dia.tardanza) return 'warn';
    return 'success';
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
}
