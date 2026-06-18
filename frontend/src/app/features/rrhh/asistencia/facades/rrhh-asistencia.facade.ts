import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { ContratoResponse } from '../../../../shared/models/rrhh/contrato-response';
import { EmpleadoRolResponse } from '../../../../shared/models/rrhh/empleado-rol-response';
import { CorregirHorarioRequest } from '../../../../shared/models/schedule/corregir-horario-request';
import {
  CumplimientoDetalleDiaResponse,
  CumplimientoResumenEmpleadoResponse,
  EstadoMonitorResponse
} from '../../../../shared/models/schedule/cumplimiento-response';
import { HorarioResponse } from '../../../../shared/models/schedule/horario-response';
import { ReemplazarHorarioRequest } from '../../../../shared/models/schedule/reemplazar-horario-request';
import { RegistrarExcepcionHorarioRequest } from '../../../../shared/models/schedule/registrar-excepcion-horario-request';
import { RrhhAsistenciaService } from '../services/rrhh-asistencia.service';

export type RrhhAsistenciaSection = 'cumplimiento' | 'hoy' | 'horarios';
export type DrawerTab = 'cumplimiento' | 'horario';

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

const REQUEST_TIMEOUT_MS = 20_000;
const MESES_ESPANOL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
const DIAS_SEMANA: string[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const MODALIDADES_SIN_ALMUERZO = new Set(['PART_TIME', 'SEMI_FULL']);

@Injectable()
export class RrhhAsistenciaFacade {
  private readonly service = inject(RrhhAsistenciaService);
  private readonly fb = inject(FormBuilder);

  // ── Estado de navegación / tab activa
  readonly activeSection = signal<RrhhAsistenciaSection>('cumplimiento');

  // ── Estado de cumplimiento mensual (Fase A)
  readonly selectedMonth = signal<string>(this.currentMonthValue());
  readonly puestoFilter = signal<string>('');
  readonly searchTerm = signal<string>('');

  private readonly empleados = signal<EmpleadoRolResponse[]>([]);
  private readonly resumenByEmpleadoId = signal<Record<number, CumplimientoResumenEmpleadoResponse>>({});
  private readonly estadosHoyByEmpleadoId = signal<Record<number, EstadoMonitorResponse>>({});
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  readonly diasSemanaOptions: readonly string[] = DIAS_SEMANA;
  readonly monthOptions: readonly MonthOption[] = this.buildMonthOptions();

  readonly puestoOptions = computed<string[]>(() => {
    const unique = new Set<string>();
    for (const e of this.empleados()) if (e.puestoTrabajo) unique.add(e.puestoTrabajo);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

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

  readonly rows = computed<CumplimientoRow[]>(() => {
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
        return {
          idEmpleado: e.idEmpleado,
          nombreCompleto: `${e.nombres} ${e.apellidos}`.trim(),
          puestoTrabajo: e.puestoTrabajo,
          diasLaborables: r?.diasLaborables ?? 0,
          diasSinRegistro: r?.diasSinRegistro ?? 0,
          cantidadTardanzas: r?.cantidadTardanzas ?? 0,
          minutosBalance: r?.minutosBalance ?? 0,
          hasResumen: Boolean(r)
        };
      })
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  });

  /**
   * Empleados cuya entrada programada ya paso y aun no han marcado.
   * Se excluyen los turnos cuya entrada todavia no llega (evita ruido visual).
   */
  readonly esperadosNoMarcados = computed(() => {
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
    const rows = this.rows();
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
  readonly drawerErrorMessage = signal<string>('');
  readonly drawerSuccessMessage = signal<string>('');
  readonly isSubmittingHorario = signal<boolean>(false);
  readonly scheduleChangeErrorMessage = signal<string>('');
  readonly scheduleChangeSuccessMessage = signal<string>('');

  // ── Sub-diálogo de decisión 409
  readonly isCorrectionDecisionVisible = signal<boolean>(false);
  readonly correctionDecisionMotivo = signal<string>('Correccion administrativa');
  readonly correctionDecisionCustomDate = signal<string>('');
  readonly isApplyingCorrectionDecision = signal<boolean>(false);

  // ── Form del horario (mismo shape que admin)
  readonly horarioForm = this.fb.nonNullable.group({
    fechaInicio: [this.getToday(), [Validators.required]],
    compensable: ['true', [Validators.required]],
    horaEntrada: ['09:00', [Validators.required]],
    horaSalida: ['18:00', [Validators.required]],
    inicioAlmuerzo: ['13:00'],
    finAlmuerzo: ['14:00'],
    diaDescanso: ['DOMINGO', [Validators.required]],
    modoAvanzado: ['false', [Validators.required]],
    detalles: this.fb.nonNullable.array(this.buildDefaultScheduleRows())
  });

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

  async recargar(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const empleados = await firstValueFrom(
        this.service.listarEmpleadosActivos().pipe(timeout(REQUEST_TIMEOUT_MS))
      );
      this.empleados.set(empleados ?? []);

      if (!empleados || empleados.length === 0) {
        this.resumenByEmpleadoId.set({});
        this.estadosHoyByEmpleadoId.set({});
        return;
      }

      const range = this.resolveMonthRange(this.selectedMonth());
      const empleadoIds = empleados.map((e) => e.idEmpleado);

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
    } catch (error) {
      this.errorMessage.set(
        this.extractErrorMessage(
          error,
          'No se pudo cargar la asistencia. Actualiza la vista; si continua, revisa que el personal tenga horario vigente.'
        )
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Drawer empleado (Fase B)
  // ─────────────────────────────────────────────────────────────────────

  setDrawerTab(tab: DrawerTab): void {
    this.drawerTab.set(tab);
  }

  async openEmployeeDrawer(idEmpleado: number): Promise<void> {
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
    this.isDrawerVisible.set(true);
    this.isLoadingDrawer.set(true);

    try {
      const range = this.resolveMonthRange(this.selectedMonth());
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
  }

  // ─────────────────────────────────────────────────────────────────────
  // Edición de horario desde el drawer
  // ─────────────────────────────────────────────────────────────────────

  async submitScheduleChange(): Promise<void> {
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
      if (formFechaInicio === horario.fechaInicio) {
        await this.runCorregir(empleado.idEmpleado, horario.id, baseRequest);
      } else {
        await this.runReemplazar(empleado.idEmpleado, horario.id, baseRequest);
      }
    } finally {
      this.isSubmittingHorario.set(false);
    }
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
      fechaInicio: horario.fechaInicio,
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

  private resolveMonthRange(monthValue: string): { desde: string; hasta: string } {
    const [year, month] = monthValue.split('-').map(Number);
    const lastDay = this.daysInMonth(year, month);
    return {
      desde: `${year}-${this.pad2(month)}-01`,
      hasta: `${year}-${this.pad2(month)}-${this.pad2(lastDay)}`
    };
  }

  private daysInMonth(year: number, month1to12: number): number {
    return new Date(year, month1to12, 0).getDate();
  }

  private getToday(): string {
    const now = new Date();
    return `${now.getFullYear()}-${this.pad2(now.getMonth() + 1)}-${this.pad2(now.getDate())}`;
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

  private extractErrorMessage(error: unknown, fallback: string): string {
    const http = error as HttpErrorResponse;
    const apiMessage = (http?.error as { message?: string } | undefined)?.message;
    return apiMessage || fallback;
  }
}
