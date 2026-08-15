import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { OperationalGateService } from '../../../../core/services/operational-gate.service';
import { ScheduleAdjustmentService } from '../../../../core/services/schedule-adjustment.service';
import { ContratoResponse } from '../../../../shared/models/rrhh/contrato-response';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';
import { CorregirHorarioRequest } from '../../../../shared/models/schedule/corregir-horario-request';
import {
  CumplimientoDetalleDiaResponse,
  CumplimientoResumenEmpleadoResponse,
  EstadoMonitorResponse
} from '../../../../shared/models/schedule/cumplimiento-response';
import { HorarioResponse } from '../../../../shared/models/schedule/horario-response';
import {
  AjusteJornadaRequest,
  AjusteJornadaResponse,
  JornadaEfectivaResponse,
  PreviewAjusteJornadaResponse,
  RazonAjuste,
  RegistrarAjusteV2Request
} from '../../../../shared/models/schedule/jornada-efectiva-response';
import { ReemplazarHorarioRequest } from '../../../../shared/models/schedule/reemplazar-horario-request';
import { RegistrarExcepcionHorarioRequest } from '../../../../shared/models/schedule/registrar-excepcion-horario-request';
import { RrhhAsistenciaService } from '../services/rrhh-asistencia.service';

export type RrhhAsistenciaSection = 'cumplimiento' | 'hoy';
export type DrawerTab = 'cumplimiento' | 'horario';
/** Filtro activo por card de métrica; recorta la bandeja sin alterar los totales de las cards. */
export type MetricFilter = 'all' | 'faltas' | 'tardanzas' | 'incidencias';

export interface CumplimientoRow {
  idEmpleado: number;
  nombreCompleto: string;
  puestoTrabajo: string;
  diasLaborables: number;
  diasSinRegistro: number;
  cantidadTardanzas: number;
  minutosBalance: number;
  hasResumen: boolean;
}

export interface MonthOption {
  value: string;
  label: string;
}

/** Un rol dentro de un grupo (Operativo/Estructural) con sus empleados. */
export interface AttendanceRoleGroup {
  rol: string;
  label: string;
  empleados: CumplimientoRow[];
}

/** Bandeja agrupada: personal operativo y estructural, cada uno subdividido por rol. */
export interface AttendanceGroupedRows {
  operativo: AttendanceRoleGroup[];
  estructural: AttendanceRoleGroup[];
}

const REQUEST_TIMEOUT_MS = 20_000;
const MESES_ESPANOL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
const DIAS_SEMANA: string[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

// Bandeja agrupada. Orden vertical de roles operativos fijado con el usuario (supervisor antes que
// asesor dentro de cada área; Ventas al final). Solo se pintan los roles que tengan empleados.
const OPERATIVO_ORDER: readonly string[] = [
  'SUPERVISOR_POSTVENTA', 'ASESOR_POSTVENTA',
  'SUPERVISOR_BACKOFFICE', 'ASESOR_BACKOFFICE',
  'SUPERVISOR_GTR', 'ASESOR_GTR',
  'SUPERVISOR_VENTAS', 'ASESOR_VENTAS',
  'ASESOR_COBRANZA'
];
const ESTRUCTURAL_ORDER: readonly string[] = [
  'RRHH', 'RECLUTADOR', 'CAPACITADOR', 'COMMUNITY', 'MONITOR', 'DESARROLLADOR', 'CONTADOR'
];
// Etiquetas humanas por rol. Para áreas con un solo nivel (solo asesor) se usa el nombre del área;
// Ventas distingue supervisor/asesor porque coexisten.
const ROLE_LABELS: Record<string, string> = {
  ASESOR_POSTVENTA: 'Postventa',
  SUPERVISOR_POSTVENTA: 'Supervisor Postventa',
  ASESOR_BACKOFFICE: 'Backoffice',
  SUPERVISOR_BACKOFFICE: 'Supervisor Backoffice',
  ASESOR_GTR: 'GTR',
  SUPERVISOR_GTR: 'Supervisor GTR',
  SUPERVISOR_VENTAS: 'Supervisor Ventas',
  ASESOR_VENTAS: 'Asesor Ventas',
  ASESOR_COBRANZA: 'Cobranza',
  RRHH: 'RRHH',
  RECLUTADOR: 'Reclutador',
  CAPACITADOR: 'Capacitador',
  COMMUNITY: 'Community',
  MONITOR: 'Monitor',
  DESARROLLADOR: 'Desarrollador',
  CONTADOR: 'Contador'
};
const MODALIDADES_SIN_ALMUERZO = new Set(['PART_TIME', 'SEMI_FULL']);
const PUESTOS_EXCLUIDOS_CUMPLIMIENTO = new Set(['OJT', 'ADMINISTRADOR']);

@Injectable()
export class RrhhAsistenciaFacade {
  private readonly service = inject(RrhhAsistenciaService);
  private readonly scheduleAdjustmentService = inject(ScheduleAdjustmentService);
  private readonly fb = inject(FormBuilder);
  private readonly operationalGateService = inject(OperationalGateService);
  private readonly operationalGate = this.operationalGateService.createGate('rrhh-asistencia');
  private recargaEnCurso = false;

  // ── Estado de navegación / tab activa
  readonly activeSection = signal<RrhhAsistenciaSection>('cumplimiento');

  // ── Estado de cumplimiento mensual (Fase A)
  readonly selectedMonth = signal<string>(this.currentMonthValue());
  readonly puestoFilter = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly activeMetricFilter = signal<MetricFilter>('all');

  private readonly empleados = signal<EmpleadoRolResponse[]>([]);
  private readonly resumenByEmpleadoId = signal<Record<number, CumplimientoResumenEmpleadoResponse>>({});
  // Resumen del mes anterior (mismo set de empleados) para calcular los deltas de las cards.
  private readonly prevResumenByEmpleadoId = signal<Record<number, CumplimientoResumenEmpleadoResponse>>({});
  private readonly estadosHoyByEmpleadoId = signal<Record<number, EstadoMonitorResponse>>({});
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly canDisplayOperationalData = this.operationalGate.canDisplayOperationalData;
  readonly canMutateOperationalData = this.operationalGate.canMutateOperationalData;

  readonly diasSemanaOptions: readonly string[] = DIAS_SEMANA;
  readonly monthOptions: readonly MonthOption[] = this.buildMonthOptions();

  readonly puestoOptions = computed<string[]>(() => {
    const unique = new Set<string>();
    for (const e of this.empleados()) if (e.puestoTrabajo) unique.add(e.puestoTrabajo);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

  /** Nombres de los empleados del reporte, para el autocompletado del buscador. */
  readonly empleadoNombres = computed<string[]>(() =>
    this.empleados()
      .map((e) => `${e.nombres} ${e.apellidos}`.trim())
      .sort((a, b) => a.localeCompare(b))
  );

  readonly monthStatus = computed<'cerrado' | 'en_curso' | 'futuro'>(() => {
    const current = this.currentMonthValue();
    const selected = this.selectedMonth();
    if (selected < current) return 'cerrado';
    if (selected === current) return 'en_curso';
    return 'futuro';
  });

  readonly monthProgress = computed<{ day: number; total: number } | null>(() => {
    if (this.monthStatus() !== 'en_curso') return null;
    const now = new Date();
    return { day: now.getDate(), total: this.daysInMonth(now.getFullYear(), now.getMonth() + 1) };
  });

  /**
   * Empleados que pasan búsqueda + puesto (sin el filtro de card). Es la base de la que se calculan
   * los KPIs y los deltas; así el total de una card no cambia al activar otra.
   */
  private readonly baseRows = computed<CumplimientoRow[]>(() => {
    if (!this.canDisplayOperationalData()) return [];

    const resumen = this.resumenByEmpleadoId();
    const search = this.searchTerm().trim().toLowerCase();
    const puesto = this.puestoFilter();

    return this.empleados()
      .filter((e) => !puesto || e.puestoTrabajo === puesto)
      .filter((e) => {
        if (!search) return true;
        return `${e.nombres} ${e.apellidos}`.toLowerCase().includes(search);
      })
      .map((e) => {
        const r = resumen[e.idEmpleado];
        const pendingToday = this.isPendingBeforeShiftToday(e.idEmpleado);
        const diasLaborables = Math.max((r?.diasLaborables ?? 0) - (pendingToday ? 1 : 0), 0);
        const diasSinRegistro = Math.max((r?.diasSinRegistro ?? 0) - (pendingToday ? 1 : 0), 0);
        return {
          idEmpleado: e.idEmpleado,
          nombreCompleto: `${e.nombres} ${e.apellidos}`.trim(),
          puestoTrabajo: e.puestoTrabajo,
          diasLaborables,
          diasSinRegistro,
          cantidadTardanzas: r?.cantidadTardanzas ?? 0,
          minutosBalance: r?.minutosBalance ?? 0,
          hasResumen: Boolean(r)
        };
      })
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  });

  /** Bandeja visible: baseRows recortada por la card activa. */
  readonly rows = computed<CumplimientoRow[]>(() => {
    const filter = this.activeMetricFilter();
    const rows = this.baseRows();
    if (filter === 'all') return rows;
    return rows.filter((r) => {
      if (filter === 'faltas') return r.diasSinRegistro > 0;
      if (filter === 'tardanzas') return r.cantidadTardanzas > 0;
      return r.diasSinRegistro > 0 || r.cantidadTardanzas > 0;
    });
  });

  /** Bandeja agrupada: Operativo/Estructural → Rol, sobre la bandeja ya filtrada. */
  readonly groupedRows = computed<AttendanceGroupedRows>(() => {
    const byRole = new Map<string, CumplimientoRow[]>();
    for (const row of this.rows()) {
      const key = this.normalizeRoleLikeValue(row.puestoTrabajo);
      const bucket = byRole.get(key);
      if (bucket) bucket.push(row);
      else byRole.set(key, [row]);
    }

    const build = (order: readonly string[]): AttendanceRoleGroup[] =>
      order
        .filter((role) => byRole.has(role))
        .map((role) => ({ rol: role, label: ROLE_LABELS[role] ?? this.humanizeRole(role), empleados: byRole.get(role)! }));

    // Roles no contemplados en ninguna lista caen en Estructural, al final, en orden alfabético.
    const classified = new Set<string>([...OPERATIVO_ORDER, ...ESTRUCTURAL_ORDER]);
    const otros: AttendanceRoleGroup[] = [...byRole.keys()]
      .filter((role) => !classified.has(role))
      .sort((a, b) => a.localeCompare(b))
      .map((role) => ({ rol: role, label: this.humanizeRole(role), empleados: byRole.get(role)! }));

    return { operativo: build(OPERATIVO_ORDER), estructural: [...build(ESTRUCTURAL_ORDER), ...otros] };
  });

  /** Totales del mes anterior sobre el mismo set de empleados; null si no hay dato previo. */
  private readonly prevKpis = computed<{ faltas: number; tardanzas: number; conIncidencias: number } | null>(() => {
    const prev = this.prevResumenByEmpleadoId();
    const rows = this.baseRows();
    if (rows.length === 0) return null;

    let has = false;
    let faltas = 0;
    let tardanzas = 0;
    let conIncidencias = 0;
    for (const row of rows) {
      const p = prev[row.idEmpleado];
      if (!p) continue;
      has = true;
      faltas += p.diasSinRegistro ?? 0;
      tardanzas += p.cantidadTardanzas ?? 0;
      if ((p.diasSinRegistro ?? 0) > 0 || (p.cantidadTardanzas ?? 0) > 0) conIncidencias += 1;
    }
    return has ? { faltas, tardanzas, conIncidencias } : null;
  });

  /** Variación porcentual mes vs mes anterior por métrica; null cuando no se puede calcular. */
  readonly kpiDeltas = computed<{ faltas: number | null; tardanzas: number | null; conIncidencias: number | null } | null>(() => {
    const prev = this.prevKpis();
    if (!prev) return null;
    const cur = this.kpis();
    const pct = (c: number, p: number) => (p === 0 ? null : Math.round(((c - p) / p) * 100));
    return {
      faltas: pct(cur.faltas, prev.faltas),
      tardanzas: pct(cur.tardanzas, prev.tardanzas),
      conIncidencias: pct(cur.conIncidencias, prev.conIncidencias)
    };
  });

  /**
   * Empleados cuya entrada programada ya paso y aun no han marcado.
   * Se excluyen los turnos cuya entrada todavia no llega (evita ruido visual).
   */
  readonly esperadosNoMarcados = computed(() => {
    if (!this.canDisplayOperationalData()) return [];

    const estados = this.estadosHoyByEmpleadoId();
    const nowMinutes = this.currentMinutesOfDay();
    return this.empleados()
      .map((e) => {
        const estado = estados[e.idEmpleado];
        if (!estado) return null;
        if (!estado.esperadoHoy || estado.tieneRegistroHoy) return null;
        const entradaProg = estado.entradaProgramada ?? null;
        if (!entradaProg) return null;
        const entradaMin = this.timeStringToMinutes(entradaProg);
        if (nowMinutes < entradaMin) return null; // turno aun no inicia
        return {
          idEmpleado: e.idEmpleado,
          nombreCompleto: `${e.nombres} ${e.apellidos}`.trim(),
          puestoTrabajo: e.puestoTrabajo,
          entradaProgramada: entradaProg,
          atrasoMinutos: nowMinutes - entradaMin
        };
      })
      .filter((x): x is { idEmpleado: number; nombreCompleto: string; puestoTrabajo: string; entradaProgramada: string; atrasoMinutos: number } => x !== null)
      .sort((a, b) => b.atrasoMinutos - a.atrasoMinutos);
  });

  readonly kpis = computed(() => {
    const rows = this.baseRows();
    let faltas = 0, tardanzas = 0, conIncidencias = 0;
    for (const r of rows) {
      faltas += r.diasSinRegistro;
      tardanzas += r.cantidadTardanzas;
      if (r.diasSinRegistro > 0 || r.cantidadTardanzas > 0) conIncidencias += 1;
    }
    return { empleados: rows.length, faltas, tardanzas, conIncidencias };
  });

  // ── Estado del drawer (Fase B)
  readonly isDrawerVisible = signal<boolean>(false);
  readonly drawerTab = signal<DrawerTab>('cumplimiento');
  readonly drawerEmpleado = signal<EmpleadoRolResponse | null>(null);
  readonly drawerContrato = signal<ContratoResponse | null>(null);
  readonly drawerHorario = signal<HorarioResponse | null>(null);
  readonly drawerDetalleDias = signal<CumplimientoDetalleDiaResponse[]>([]);
  readonly isLoadingDrawer = signal<boolean>(false);
  // Mes propio del drawer (independiente del de la bandeja) + carga de su detalle.
  readonly drawerSelectedMonth = signal<string>(this.currentMonthValue());
  readonly isLoadingDrawerDetalle = signal<boolean>(false);

  /** Faltas, tardanzas y balance del empleado en el mes del drawer, derivados del detalle diario. */
  readonly drawerKpis = computed(() => {
    let faltas = 0;
    let tardanzas = 0;
    let balanceMin = 0;
    for (const dia of this.drawerDetalleDias()) {
      if (dia.laborable && !dia.horaEntradaAsistencia) faltas += 1;
      if (dia.tardanza) tardanzas += 1;
      balanceMin += dia.minutosBalance ?? 0;
    }
    return { faltas, tardanzas, balanceMin };
  });
  readonly drawerErrorMessage = signal<string>('');
  readonly drawerSuccessMessage = signal<string>('');
  readonly isSubmittingHorario = signal<boolean>(false);
  readonly scheduleChangeErrorMessage = signal<string>('');
  readonly scheduleChangeSuccessMessage = signal<string>('');

  // Ajuste puntual del horario efectivo de un dia
  readonly isAdjustmentDialogVisible = signal<boolean>(false);
  readonly adjustmentDate = signal<string>('');
  readonly adjustmentJornada = signal<JornadaEfectivaResponse | null>(null);
  readonly adjustmentPreview = signal<PreviewAjusteJornadaResponse | null>(null);
  readonly adjustmentHistory = signal<AjusteJornadaResponse[]>([]);
  readonly isLoadingAdjustment = signal<boolean>(false);
  readonly isSavingAdjustment = signal<boolean>(false);
  readonly adjustmentError = signal<string | null>(null);
  readonly adjustmentEmployeeName = computed(() => {
    const empleado = this.drawerEmpleado();
    return empleado ? `${empleado.nombres} ${empleado.apellidos}`.trim() : '';
  });

  // ── Sub-diálogo de decisión 409
  readonly isCorrectionDecisionVisible = signal<boolean>(false);
  readonly correctionDecisionMotivo = signal<string>('Correccion administrativa');
  readonly correctionDecisionCustomDate = signal<string>('');
  readonly isApplyingCorrectionDecision = signal<boolean>(false);

  // ── Form del horario (mismo shape que admin)
  readonly horarioForm = this.fb.nonNullable.group({
    fechaInicio: [this.getTomorrow(), [Validators.required]],
    compensable: ['true', [Validators.required]],
    horaEntrada: ['09:00', [Validators.required]],
    horaSalida: ['18:00', [Validators.required]],
    inicioAlmuerzo: ['13:00'],
    finAlmuerzo: ['14:00'],
    diaDescanso: ['DOMINGO', [Validators.required]],
    modoAvanzado: ['false', [Validators.required]],
    detalles: this.fb.nonNullable.array(this.buildDefaultScheduleRows())
  });

  constructor() {
    effect(() => {
      this.operationalGateService.currentStatus();

      if (!this.operationalGate.canActivateOperationalData() || this.operationalGate.hasActivatedOperationalData()) {
        return;
      }

      void this.recargar();
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Mes / filtros / cumplimiento (Fase A)
  // ─────────────────────────────────────────────────────────────────────

  setActiveSection(section: RrhhAsistenciaSection): void {
    this.activeSection.set(section);
  }

  setSelectedMonth(month: string): void {
    if (!month || month === this.selectedMonth()) return;
    this.selectedMonth.set(month);
    void this.recargar();
  }

  setPuestoFilter(puesto: string): void {
    this.puestoFilter.set(puesto ?? '');
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value ?? '');
  }

  /** Click en una card: activa su filtro, o lo apaga si ya estaba activo (vuelve a "todos"). */
  setMetricFilter(filter: MetricFilter): void {
    this.activeMetricFilter.update((current) => (current === filter ? 'all' : filter));
  }

  async recargar(): Promise<void> {
    if (!this.canDisplayOperationalData() || this.recargaEnCurso) {
      return;
    }

    this.recargaEnCurso = true;
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const empleados = await firstValueFrom(
        this.service.listarEmpleadosActivos().pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      const empleadosCumplimiento = (empleados ?? []).filter((empleado) => this.isIncludedInAttendanceReport(empleado));
      this.empleados.set(empleadosCumplimiento);

      if (empleadosCumplimiento.length === 0) {
        this.resumenByEmpleadoId.set({});
        this.estadosHoyByEmpleadoId.set({});
        this.prevResumenByEmpleadoId.set({});
        return;
      }

      const range = this.resolveMonthRange(this.selectedMonth());
      const empleadoIds = empleadosCumplimiento.map((e) => e.idEmpleado);

      const [resumen, estados] = await Promise.all([
        firstValueFrom(
          this.service
            .getCumplimientoResumen({ empleadoIds, desde: range.desde, hasta: range.hasta })
            .pipe(timeout(REQUEST_TIMEOUT_MS))
        ),
        firstValueFrom(
          this.service.getEstadosMonitor(empleadoIds).pipe(timeout(REQUEST_TIMEOUT_MS))
        )
      ]);

      const map: Record<number, CumplimientoResumenEmpleadoResponse> = {};
      for (const item of resumen.empleados) map[item.idEmpleado] = item;
      this.resumenByEmpleadoId.set(map);

      const estadosMap: Record<number, EstadoMonitorResponse> = {};
      for (const item of estados ?? []) estadosMap[item.idEmpleado] = item;
      this.estadosHoyByEmpleadoId.set(estadosMap);
      this.operationalGate.markActivated();

      // Deltas: carga en segundo plano el mes anterior; si falla, simplemente no se muestran.
      void this.loadPrevMonthResumen(empleadoIds);
    } catch (error) {
      this.errorMessage.set(
        this.extractErrorMessage(
          error,
          'No se pudo cargar la asistencia. Actualiza la vista; si continua, revisa que el personal tenga horario vigente.'
        )
      );
    } finally {
      this.recargaEnCurso = false;
      this.isLoading.set(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Drawer empleado (Fase B)
  // ─────────────────────────────────────────────────────────────────────

  setDrawerTab(tab: DrawerTab): void {
    this.drawerTab.set(tab);
  }

  /** Cambia el mes del drawer y recarga solo su detalle diario (no toca contrato ni horario). */
  setDrawerMonth(month: string): void {
    if (!month || month === this.drawerSelectedMonth()) return;
    this.drawerSelectedMonth.set(month);
    void this.reloadDrawerDetalle();
  }

  private async reloadDrawerDetalle(): Promise<void> {
    const empleado = this.drawerEmpleado();
    if (!empleado) return;
    this.isLoadingDrawerDetalle.set(true);
    this.drawerErrorMessage.set('');
    try {
      const range = this.resolveMonthRange(this.drawerSelectedMonth());
      const detalle = await firstValueFrom(
        this.service
          .getCumplimientoDetalle({ empleadoIds: [empleado.idEmpleado], desde: range.desde, hasta: range.hasta })
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.drawerDetalleDias.set(detalle.empleados[0]?.dias ?? []);
    } catch (error) {
      this.drawerErrorMessage.set(this.extractErrorMessage(error, 'No fue posible cargar el detalle del mes.'));
    } finally {
      this.isLoadingDrawerDetalle.set(false);
    }
  }

  async openEmployeeDrawer(idEmpleado: number): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      this.errorMessage.set('Marca tu asistencia para revisar el detalle del equipo.');
      return;
    }

    const empleado = this.empleados().find((e) => e.idEmpleado === idEmpleado) ?? null;
    if (!empleado) return;

    this.drawerEmpleado.set(empleado);
    this.drawerContrato.set(null);
    this.drawerHorario.set(null);
    this.drawerDetalleDias.set([]);
    this.drawerErrorMessage.set('');
    this.drawerSuccessMessage.set('');
    this.scheduleChangeErrorMessage.set('');
    this.scheduleChangeSuccessMessage.set('');
    this.drawerTab.set('cumplimiento');
    this.drawerSelectedMonth.set(this.selectedMonth());
    this.isDrawerVisible.set(true);
    this.isLoadingDrawer.set(true);

    try {
      const range = this.resolveMonthRange(this.drawerSelectedMonth());
      const [contrato, horario, detalle] = await Promise.all([
        firstValueFrom(this.service.getContratoVigente(idEmpleado).pipe(timeout(REQUEST_TIMEOUT_MS))),
        firstValueFrom(this.service.getHorarioVigente(idEmpleado, this.getToday()).pipe(timeout(REQUEST_TIMEOUT_MS))),
        firstValueFrom(
          this.service
            .getCumplimientoDetalle({ empleadoIds: [idEmpleado], desde: range.desde, hasta: range.hasta })
            .pipe(timeout(REQUEST_TIMEOUT_MS))
        )
      ]);

      this.drawerContrato.set(contrato);
      this.drawerHorario.set(horario);
      this.drawerDetalleDias.set(detalle.empleados[0]?.dias ?? []);
      this.populateScheduleForm(horario, contrato.modalidad);
    } catch (error) {
      this.drawerErrorMessage.set(this.extractErrorMessage(error, 'No fue posible cargar la informacion del empleado.'));
    } finally {
      this.isLoadingDrawer.set(false);
    }
  }

  closeEmployeeDrawer(): void {
    this.isDrawerVisible.set(false);
    this.drawerEmpleado.set(null);
    this.drawerContrato.set(null);
    this.drawerHorario.set(null);
    this.drawerDetalleDias.set([]);
    this.isCorrectionDecisionVisible.set(false);
    this.closeScheduleAdjustment();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Edición de horario desde el drawer
  // ─────────────────────────────────────────────────────────────────────

  async submitScheduleChange(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }

    const empleado = this.drawerEmpleado();
    const horario = this.drawerHorario();
    const contrato = this.drawerContrato();
    if (!empleado || !horario || !contrato) return;

    this.syncLunchBreakControls();
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    const formFechaInicio = this.horarioForm.controls.fechaInicio.getRawValue();
    if (formFechaInicio < horario.fechaInicio) {
      this.scheduleChangeErrorMessage.set(
        'La nueva fecha de inicio no puede ser anterior al inicio del horario actual.'
      );
      return;
    }

    this.scheduleChangeErrorMessage.set('');
    this.scheduleChangeSuccessMessage.set('');
    this.isSubmittingHorario.set(true);

    try {
      const baseRequest = this.buildHorarioRequestForModalidad(contrato.modalidad);
      const horarioEnFecha = await firstValueFrom(
        this.service
          .getHorarioVigente(empleado.idEmpleado, formFechaInicio)
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );

      if (horarioEnFecha.fechaInicio === formFechaInicio) {
        await this.runCorregir(empleado.idEmpleado, horarioEnFecha.id, baseRequest);
      } else {
        await this.runReemplazar(empleado.idEmpleado, horarioEnFecha.id, baseRequest);
      }
    } finally {
      this.isSubmittingHorario.set(false);
    }
  }

  openScheduleAdjustment(): void {
    if (!this.ensureCanMutate()) {
      return;
    }

    if (!this.drawerEmpleado()) return;
    this.adjustmentDate.set(this.getToday());
    this.adjustmentPreview.set(null);
    this.adjustmentError.set(null);
    this.isAdjustmentDialogVisible.set(true);
    void this.loadScheduleAdjustment();
  }

  closeScheduleAdjustment(): void {
    this.isAdjustmentDialogVisible.set(false);
    this.adjustmentJornada.set(null);
    this.adjustmentPreview.set(null);
    this.adjustmentHistory.set([]);
    this.adjustmentError.set(null);
  }

  changeScheduleAdjustmentDate(fecha: string): void {
    this.adjustmentDate.set(fecha);
    this.adjustmentPreview.set(null);
    void this.loadScheduleAdjustment();
  }

  async previewScheduleAdjustment(request: AjusteJornadaRequest): Promise<void> {
    const empleado = this.drawerEmpleado();
    if (!empleado) return;
    this.isLoadingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      const preview = await firstValueFrom(
        this.scheduleAdjustmentService
          .preview(empleado.idEmpleado, request)
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.adjustmentPreview.set(preview);
    } catch (error) {
      this.adjustmentError.set(this.extractErrorMessage(error, 'No se pudo preparar la vista previa.'));
    } finally {
      this.isLoadingAdjustment.set(false);
    }
  }

  async saveScheduleAdjustment(request: AjusteJornadaRequest): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }

    const empleado = this.drawerEmpleado();
    if (!empleado) return;
    this.isSavingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      await firstValueFrom(
        this.scheduleAdjustmentService
          .registrar(empleado.idEmpleado, request)
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.scheduleChangeSuccessMessage.set('Ajuste puntual guardado. El horario base no cambio.');
      await this.loadScheduleAdjustment();
      await this.refreshDrawerAfterScheduleMutation(empleado.idEmpleado);
      void this.recargar();
    } catch (error) {
      this.adjustmentError.set(this.extractErrorMessage(error, 'No se pudo guardar el ajuste puntual.'));
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  async cancelScheduleAdjustment(idAjuste: number): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }

    const empleado = this.drawerEmpleado();
    if (!empleado) return;
    this.isSavingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      await firstValueFrom(
        this.scheduleAdjustmentService
          .cancelar(empleado.idEmpleado, idAjuste)
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      await this.loadScheduleAdjustment();
      await this.refreshDrawerAfterScheduleMutation(empleado.idEmpleado);
      void this.recargar();
    } catch (error) {
      this.adjustmentError.set(this.extractErrorMessage(error, 'No se pudo cancelar el ajuste puntual.'));
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  /** Ajustes del día (v2): carga la jornada base del día para el editor inline (horas extra / compensación). */
  async openDayAdjustment(fecha: string): Promise<void> {
    if (!this.ensureCanMutate() || !this.drawerEmpleado()) return;
    this.adjustmentDate.set(fecha);
    this.adjustmentError.set(null);
    await this.loadScheduleAdjustment();
  }

  /** Guarda una lista de tramos v2 con la razón dada (N llamadas secuenciales; reporta parciales). */
  async submitDayExtension(requests: AjusteJornadaRequest[], razon: RazonAjuste): Promise<boolean> {
    if (!this.ensureCanMutate()) return false;
    const empleado = this.drawerEmpleado();
    if (!empleado || requests.length === 0) return false;

    this.isSavingAdjustment.set(true);
    this.adjustmentError.set(null);
    let guardados = 0;
    try {
      for (const req of requests) {
        await firstValueFrom(
          this.scheduleAdjustmentService
            .registrarV2(empleado.idEmpleado, { ...req, razon })
            .pipe(timeout(REQUEST_TIMEOUT_MS))
        );
        guardados += 1;
      }
      this.scheduleChangeSuccessMessage.set(
        razon === 'COMPENSACION' ? 'Horas de compensación registradas.' : 'Horas extra registradas.'
      );
      await this.loadScheduleAdjustment();
      await this.refreshDrawerAfterScheduleMutation(empleado.idEmpleado);
      void this.recargar();
      return true;
    } catch (error) {
      const parcial = guardados > 0 ? ` (${guardados} de ${requests.length} guardados)` : '';
      this.adjustmentError.set(this.extractErrorMessage(error, 'No se pudo guardar el ajuste.') + parcial);
      await this.loadScheduleAdjustment();
      return false;
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  /**
   * Corrimiento del horario base (v2, REEMPLAZO_BASE): una sola llamada con la razón que decidió el editor
   * (compensable / justificada). La autorización fina y el déficit los valida el backend por rol + razón.
   */
  async submitCorrimiento(request: RegistrarAjusteV2Request): Promise<boolean> {
    if (!this.ensureCanMutate()) return false;
    const empleado = this.drawerEmpleado();
    if (!empleado) return false;

    this.isSavingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      await firstValueFrom(
        this.scheduleAdjustmentService.registrarV2(empleado.idEmpleado, request).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.scheduleChangeSuccessMessage.set('Horario corrido.');
      await this.loadScheduleAdjustment();
      await this.refreshDrawerAfterScheduleMutation(empleado.idEmpleado);
      void this.recargar();
      return true;
    } catch (error) {
      this.adjustmentError.set(this.extractErrorMessage(error, 'No se pudo correr el horario.'));
      await this.loadScheduleAdjustment();
      return false;
    } finally {
      this.isSavingAdjustment.set(false);
    }
  }

  private async loadScheduleAdjustment(): Promise<void> {
    const empleado = this.drawerEmpleado();
    const fecha = this.adjustmentDate();
    if (!empleado || !fecha) return;
    this.isLoadingAdjustment.set(true);
    this.adjustmentError.set(null);
    try {
      const [jornada, history] = await Promise.all([
        firstValueFrom(
          this.scheduleAdjustmentService
            .getJornada(empleado.idEmpleado, fecha)
            .pipe(timeout(REQUEST_TIMEOUT_MS))
        ),
        firstValueFrom(
          this.scheduleAdjustmentService
            .listar(empleado.idEmpleado, fecha)
            .pipe(timeout(REQUEST_TIMEOUT_MS))
        )
      ]);
      this.adjustmentJornada.set(jornada);
      this.adjustmentHistory.set(history);
    } catch (error) {
      this.adjustmentError.set(this.extractErrorMessage(error, 'No fue posible cargar el horario de ese dia.'));
    } finally {
      this.isLoadingAdjustment.set(false);
    }
  }

  private async refreshDrawerAfterScheduleMutation(idEmpleado: number): Promise<void> {
    const range = this.resolveMonthRange(this.selectedMonth());
    const [horario, detalle] = await Promise.all([
      firstValueFrom(this.service.getHorarioVigente(idEmpleado, this.getToday()).pipe(timeout(REQUEST_TIMEOUT_MS))),
      firstValueFrom(
        this.service
          .getCumplimientoDetalle({ empleadoIds: [idEmpleado], desde: range.desde, hasta: range.hasta })
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      )
    ]);
    this.drawerHorario.set(horario);
    this.drawerDetalleDias.set(detalle.empleados[0]?.dias ?? []);
  }

  private async runCorregir(
    idEmpleado: number,
    idHorario: number,
    baseRequest: { modalidad: string; fechaInicio: string; compensable: boolean; detalles: any[] }
  ): Promise<void> {
    const patchRequest: CorregirHorarioRequest = {
      modalidad: baseRequest.modalidad,
      compensable: baseRequest.compensable,
      detalles: baseRequest.detalles
    };
    try {
      const horario = await firstValueFrom(
        this.service.corregirHorario(idHorario, patchRequest).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.scheduleChangeSuccessMessage.set('Horario corregido. Los cambios aplican desde la vigencia actual.');
      this.drawerHorario.set(horario);
      void this.recargar();
    } catch (error) {
      const http = error as HttpErrorResponse;
      if (http?.status === 409) {
        this.correctionDecisionMotivo.set('Correccion administrativa');
        this.correctionDecisionCustomDate.set(this.addDays(this.getToday(), 1));
        this.isCorrectionDecisionVisible.set(true);
        return;
      }
      this.scheduleChangeErrorMessage.set(this.extractErrorMessage(error, 'No se pudo corregir el horario.'));
    }
  }

  private async runReemplazar(
    idEmpleado: number,
    idHorario: number,
    baseRequest: { modalidad: string; fechaInicio: string; compensable: boolean; detalles: any[] }
  ): Promise<void> {
    const putRequest: ReemplazarHorarioRequest = {
      modalidad: baseRequest.modalidad,
      fechaInicio: baseRequest.fechaInicio,
      compensable: baseRequest.compensable,
      detalles: baseRequest.detalles
    };
    try {
      const horario = await firstValueFrom(
        this.service.reemplazarHorario(idHorario, putRequest).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.scheduleChangeSuccessMessage.set('Horario actualizado. La nueva vigencia iniciara en la fecha seleccionada.');
      this.drawerHorario.set(horario);
      void this.recargar();
    } catch (error) {
      this.scheduleChangeErrorMessage.set(this.extractErrorMessage(error, 'No se pudo cambiar el horario.'));
    }
  }

  // ── Sub-diálogo 409 — 4 opciones

  closeCorrectionDecision(): void {
    this.isCorrectionDecisionVisible.set(false);
    this.isApplyingCorrectionDecision.set(false);
  }

  setCorrectionDecisionMotivo(value: string): void {
    this.correctionDecisionMotivo.set(value);
  }

  setCorrectionDecisionCustomDate(value: string): void {
    this.correctionDecisionCustomDate.set(value);
  }

  async applyCorrectionOnlyToday(): Promise<void> {
    await this.runCorrectionDecision(async (idEmpleado, horario, baseRequest) => {
      await this.crearExcepcionDelDia(horario.id, this.getToday(), baseRequest);
      this.scheduleChangeSuccessMessage.set('Excepcion registrada solo para hoy. El horario base se mantiene.');
    });
  }

  async applyCorrectionFromTomorrow(): Promise<void> {
    await this.runCorrectionDecision(async (idEmpleado, horario, baseRequest) => {
      const fechaInicio = this.addDays(this.getToday(), 1);
      await this.reemplazarConFecha(horario.id, baseRequest, fechaInicio);
      this.scheduleChangeSuccessMessage.set('Nuevo horario aplicado desde manana. El actual se cierra hoy.');
    });
  }

  async applyCorrectionTodayAndTomorrow(): Promise<void> {
    await this.runCorrectionDecision(async (idEmpleado, horario, baseRequest) => {
      await this.crearExcepcionDelDia(horario.id, this.getToday(), baseRequest);
      const fechaInicio = this.addDays(this.getToday(), 1);
      await this.reemplazarConFecha(horario.id, baseRequest, fechaInicio);
      this.scheduleChangeSuccessMessage.set('Excepcion creada para hoy y nuevo horario aplicado desde manana.');
    });
  }

  async applyCorrectionFromCustomDate(): Promise<void> {
    const customDate = this.correctionDecisionCustomDate();
    const today = this.getToday();
    if (!customDate || customDate <= today) {
      this.scheduleChangeErrorMessage.set('La fecha debe ser posterior a hoy.');
      return;
    }
    await this.runCorrectionDecision(async (idEmpleado, horario, baseRequest) => {
      await this.reemplazarConFecha(horario.id, baseRequest, customDate);
      this.scheduleChangeSuccessMessage.set(`Nuevo horario aplicado desde ${customDate}. El actual se cierra el dia anterior.`);
    });
  }

  private async runCorrectionDecision(
    action: (
      idEmpleado: number,
      horario: HorarioResponse,
      baseRequest: { modalidad: string; fechaInicio: string; compensable: boolean; detalles: any[] }
    ) => Promise<void>
  ): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }

    const empleado = this.drawerEmpleado();
    const horario = this.drawerHorario();
    const contrato = this.drawerContrato();
    if (!empleado || !horario || !contrato) return;

    this.scheduleChangeErrorMessage.set('');
    this.isApplyingCorrectionDecision.set(true);
    try {
      const baseRequest = this.buildHorarioRequestForModalidad(contrato.modalidad);
      await action(empleado.idEmpleado, horario, baseRequest);
      this.isCorrectionDecisionVisible.set(false);
      const refreshed = await firstValueFrom(
        this.service.getHorarioVigente(empleado.idEmpleado, this.getToday()).pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.drawerHorario.set(refreshed);
      void this.recargar();
    } catch (error) {
      this.scheduleChangeErrorMessage.set(this.extractErrorMessage(error, 'No se pudo aplicar la correccion.'));
    } finally {
      this.isApplyingCorrectionDecision.set(false);
    }
  }

  private async crearExcepcionDelDia(
    idHorario: number,
    fecha: string,
    baseRequest: { modalidad: string; detalles: any[] }
  ): Promise<void> {
    const raw = this.horarioForm.getRawValue();
    const requiereAlmuerzo = this.requiresLunchBreak(baseRequest.modalidad);
    const motivo = this.correctionDecisionMotivo().trim() || 'Correccion administrativa';

    const excepcionRequest: RegistrarExcepcionHorarioRequest = {
      fecha,
      tipo: 'CAMBIO_COMPLETO',
      horaEntrada: raw.horaEntrada,
      horaSalida: raw.horaSalida,
      inicioAlmuerzo: requiereAlmuerzo ? raw.inicioAlmuerzo : null,
      finAlmuerzo: requiereAlmuerzo ? raw.finAlmuerzo : null,
      laborable: true,
      motivo
    };

    await firstValueFrom(
      this.service.registrarExcepcionHorario(idHorario, excepcionRequest).pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }

  private async reemplazarConFecha(
    idHorario: number,
    baseRequest: { modalidad: string; compensable: boolean; detalles: any[] },
    fechaInicio: string
  ): Promise<void> {
    const putRequest: ReemplazarHorarioRequest = {
      modalidad: baseRequest.modalidad,
      fechaInicio,
      compensable: baseRequest.compensable,
      detalles: baseRequest.detalles
    };
    await firstValueFrom(
      this.service.reemplazarHorario(idHorario, putRequest).pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // Helpers del horarioForm (simple/avanzado, sync, build request)
  // ─────────────────────────────────────────────────────────────────────

  applySimpleSchedule(): void {
    const raw = this.horarioForm.getRawValue();
    const requiereAlmuerzo = this.requiresLunchBreak(this.currentScheduleModalidad());
    for (const row of this.horarioForm.controls.detalles.controls) {
      row.patchValue({
        horaEntrada: raw.horaEntrada,
        horaSalida: raw.horaSalida,
        inicioAlmuerzo: requiereAlmuerzo ? raw.inicioAlmuerzo : '',
        finAlmuerzo: requiereAlmuerzo ? raw.finAlmuerzo : '',
        laborable: row.controls.dia.getRawValue() === raw.diaDescanso ? 'false' : 'true'
      });
    }
  }

  buildHorarioRequestForModalidad(modalidad: string): {
    modalidad: string;
    fechaInicio: string;
    compensable: boolean;
    detalles: any[];
  } {
    this.syncLunchBreakControls();
    if (this.horarioForm.controls.modoAvanzado.getRawValue() !== 'true') {
      this.applySimpleSchedule();
    }
    const raw = this.horarioForm.getRawValue();
    const requiereAlmuerzo = this.requiresLunchBreak(modalidad);

    return {
      modalidad,
      fechaInicio: raw.fechaInicio,
      compensable: raw.compensable === 'true',
      detalles: raw.detalles.map((detalle) => ({
        dia: detalle.dia,
        horaEntrada: detalle.horaEntrada,
        horaSalida: detalle.horaSalida,
        inicioAlmuerzo: requiereAlmuerzo ? detalle.inicioAlmuerzo : null,
        finAlmuerzo: requiereAlmuerzo ? detalle.finAlmuerzo : null,
        laborable: detalle.laborable === 'true'
      }))
    };
  }

  private currentScheduleModalidad(): string {
    return this.drawerContrato()?.modalidad ?? 'FULL_TIME';
  }

  private isIncludedInAttendanceReport(empleado: EmpleadoRolResponse): boolean {
    return !PUESTOS_EXCLUIDOS_CUMPLIMIENTO.has(this.normalizeRoleLikeValue(empleado.puestoTrabajo));
  }

  private normalizeRoleLikeValue(value: string | null | undefined): string {
    return (value ?? '').trim().toUpperCase().replaceAll(' ', '_');
  }

  private humanizeRole(role: string): string {
    return role
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private syncLunchBreakControls(): void {
    const requiereAlmuerzo = this.requiresLunchBreak(this.currentScheduleModalidad());
    const lunchStart = this.horarioForm.controls.inicioAlmuerzo;
    const lunchEnd = this.horarioForm.controls.finAlmuerzo;
    if (requiereAlmuerzo) {
      if (!lunchStart.getRawValue()) lunchStart.setValue('13:00');
      if (!lunchEnd.getRawValue()) lunchEnd.setValue('14:00');
    } else {
      lunchStart.setValue('');
      lunchEnd.setValue('');
    }
    this.horarioForm.updateValueAndValidity({ emitEvent: false });
  }

  private populateScheduleForm(horario: HorarioResponse, modalidad: string): void {
    const laborables = horario.detalles.filter((d) => d.laborable);
    const descanso = horario.detalles.find((d) => !d.laborable)?.dia ?? 'DOMINGO';
    const first = laborables[0] ?? horario.detalles[0];

    this.horarioForm.reset({
      fechaInicio: this.getTomorrow(),
      compensable: String(horario.compensable ?? true),
      horaEntrada: first?.horaEntrada ?? '09:00',
      horaSalida: first?.horaSalida ?? '18:00',
      inicioAlmuerzo: first?.inicioAlmuerzo ?? '13:00',
      finAlmuerzo: first?.finAlmuerzo ?? '14:00',
      diaDescanso: descanso,
      modoAvanzado: 'false',
      detalles: DIAS_SEMANA.map((dia) => {
        const d = horario.detalles.find((x) => x.dia === dia);
        return {
          dia,
          horaEntrada: d?.horaEntrada ?? '09:00',
          horaSalida: d?.horaSalida ?? '18:00',
          inicioAlmuerzo: d?.inicioAlmuerzo ?? '13:00',
          finAlmuerzo: d?.finAlmuerzo ?? '14:00',
          laborable: d?.laborable === false ? 'false' : 'true'
        };
      })
    });
    this.syncLunchBreakControls();
  }

  private buildDefaultScheduleRows() {
    return DIAS_SEMANA.map((dia) =>
      this.fb.nonNullable.group({
        dia: [dia, [Validators.required]],
        horaEntrada: ['09:00', [Validators.required]],
        horaSalida: ['18:00', [Validators.required]],
        inicioAlmuerzo: ['13:00'],
        finAlmuerzo: ['14:00'],
        laborable: [dia === 'DOMINGO' ? 'false' : 'true', [Validators.required]]
      })
    );
  }

  private requiresLunchBreak(modalidad: string): boolean {
    return !MODALIDADES_SIN_ALMUERZO.has(modalidad);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Helpers genéricos
  // ─────────────────────────────────────────────────────────────────────

  private currentMonthValue(): string {
    const now = new Date();
    return `${now.getFullYear()}-${this.pad2(now.getMonth() + 1)}`;
  }

  private buildMonthOptions(): MonthOption[] {
    const options: MonthOption[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${this.pad2(date.getMonth() + 1)}`;
      const label = `${this.capitalize(MESES_ESPANOL[date.getMonth()])} ${date.getFullYear()}`;
      options.push({ value, label });
    }
    return options;
  }

  /** Descarga el resumen del mes anterior (mismo set de empleados) para los deltas. Tolerante a fallos. */
  private async loadPrevMonthResumen(empleadoIds: number[]): Promise<void> {
    const range = this.previousMonthRangeAligned();
    try {
      const resumen = await firstValueFrom(
        this.service
          .getCumplimientoResumen({ empleadoIds, desde: range.desde, hasta: range.hasta })
          .pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      const map: Record<number, CumplimientoResumenEmpleadoResponse> = {};
      for (const item of resumen.empleados) map[item.idEmpleado] = item;
      this.prevResumenByEmpleadoId.set(map);
    } catch {
      this.prevResumenByEmpleadoId.set({});
    }
  }

  private previousMonthValue(monthValue: string): string {
    const [year, month] = monthValue.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${this.pad2(date.getMonth() + 1)}`;
  }

  /**
   * Rango del mes anterior alineado "a la fecha": si el mes actual va por el día D, se compara contra
   * el día 1..D del mes previo (no el mes completo). Así el delta no miente al inicio del mes, cuando
   * un mes parcial contra uno completo daría siempre caídas enormes.
   */
  private previousMonthRangeAligned(): { desde: string; hasta: string } {
    const currentRange = this.resolveMonthRange(this.selectedMonth());
    const currentHastaDay = Number(currentRange.hasta.split('-')[2]);
    const [year, month] = this.previousMonthValue(this.selectedMonth()).split('-').map(Number);
    const day = Math.min(currentHastaDay, this.daysInMonth(year, month));
    return {
      desde: `${year}-${this.pad2(month)}-01`,
      hasta: `${year}-${this.pad2(month)}-${this.pad2(day)}`
    };
  }

  private resolveMonthRange(monthValue: string): { desde: string; hasta: string } {
    const [year, month] = monthValue.split('-').map(Number);
    const lastDay = this.daysInMonth(year, month);
    const currentMonth = this.currentMonthValue();
    const selectedMonth = `${year}-${this.pad2(month)}`;
    const endDay = selectedMonth === currentMonth ? new Date().getDate() : lastDay;
    return {
      desde: `${year}-${this.pad2(month)}-01`,
      hasta: `${year}-${this.pad2(month)}-${this.pad2(endDay)}`
    };
  }

  private daysInMonth(year: number, month1to12: number): number {
    return new Date(year, month1to12, 0).getDate();
  }

  private getToday(): string {
    const now = new Date();
    return `${now.getFullYear()}-${this.pad2(now.getMonth() + 1)}-${this.pad2(now.getDate())}`;
  }

  private getTomorrow(): string {
    return this.addDays(this.getToday(), 1);
  }

  private addDays(value: string, days: number): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${this.pad2(date.getMonth() + 1)}-${this.pad2(date.getDate())}`;
  }

  private pad2(value: number): string {
    return value < 10 ? `0${value}` : String(value);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private currentMinutesOfDay(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private timeStringToMinutes(value: string): number {
    const parts = value.split(':');
    if (parts.length < 2) return 0;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  }

  private isPendingBeforeShiftToday(idEmpleado: number): boolean {
    if (this.selectedMonth() !== this.currentMonthValue()) return false;
    const estado = this.estadosHoyByEmpleadoId()[idEmpleado];
    if (!estado?.esperadoHoy || estado.tieneRegistroHoy || !estado.entradaProgramada) return false;
    return this.currentMinutesOfDay() < this.timeStringToMinutes(estado.entradaProgramada);
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const http = error as HttpErrorResponse;
    const apiMessage = (http?.error as { message?: string } | undefined)?.message;

    if (http?.status === 401) {
      return 'Tu sesion vencio. Vuelve a ingresar para revisar la asistencia.';
    }

    if (http?.status === 500) {
      return 'No se pudo preparar el resumen de asistencia. Intenta actualizar en unos minutos.';
    }

    return apiMessage || fallback;
  }

  private ensureCanMutate(): boolean {
    if (this.canMutateOperationalData()) {
      return true;
    }

    this.scheduleChangeErrorMessage.set('Marca tu asistencia para modificar horarios.');
    return false;
  }
}
