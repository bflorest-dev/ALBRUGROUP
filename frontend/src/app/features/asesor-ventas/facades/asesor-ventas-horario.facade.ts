import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AsistenciaDiaCalendarioResponse } from '../../../shared/models/schedule/asistencia-mes-response';
import { HorarioMesVigenciaResponse } from '../../../shared/models/schedule/horario-mes-response';

export interface DiaAsistenciaVm {
  fecha: string;
  fechaDisplay: string;
  entradaProgramada: string;
  entradaReal: string;
  isTardanza: boolean;
  tardanzaLabel: string;
  horasTrabajadas: string;
  balance: string;
  balancePositivo: boolean | null;
  estadoActual: string;
}

export interface HorarioDiaVm {
  diaNorm: string;
  diaLabel: string;
  horaEntrada: string;
  horaSalida: string;
  laborable: boolean;
}

type DataStatus = 'idle' | 'loading' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class AsesorVentasHorarioFacade {
  private readonly attendanceService = inject(AttendanceService);

  private readonly now = new Date();
  private readonly monthKey = signal({
    anio: this.now.getFullYear(),
    mes: this.now.getMonth() + 1
  });

  readonly selectedMonthLabel = computed(() => {
    const { anio, mes } = this.monthKey();
    return new Date(anio, mes - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  });

  readonly canGoNext = computed(() => {
    const { anio, mes } = this.monthKey();
    const now = new Date();
    return anio < now.getFullYear() || (anio === now.getFullYear() && mes < now.getMonth() + 1);
  });

  private readonly horariosState = toSignal(
    toObservable(this.monthKey).pipe(
      switchMap(({ anio, mes }) =>
        this.attendanceService.getHorarioMes(anio, mes).pipe(
          map(response => ({ status: 'success' as DataStatus, data: response.vigencias })),
          startWith({ status: 'loading' as DataStatus, data: [] as HorarioMesVigenciaResponse[] }),
          catchError(() => of({ status: 'error' as DataStatus, data: [] as HorarioMesVigenciaResponse[] }))
        )
      )
    ),
    { initialValue: { status: 'idle' as DataStatus, data: [] as HorarioMesVigenciaResponse[] } }
  );

  private readonly asistenciaState = toSignal(
    toObservable(this.monthKey).pipe(
      switchMap(({ anio, mes }) =>
        this.attendanceService.getAsistenciaMes(anio, mes).pipe(
          map(response => ({ status: 'success' as DataStatus, data: response.dias })),
          startWith({ status: 'loading' as DataStatus, data: [] as AsistenciaDiaCalendarioResponse[] }),
          catchError(() => of({ status: 'error' as DataStatus, data: [] as AsistenciaDiaCalendarioResponse[] }))
        )
      )
    ),
    { initialValue: { status: 'idle' as DataStatus, data: [] as AsistenciaDiaCalendarioResponse[] } }
  );

  readonly isLoading = computed(() => {
    const hs = this.horariosState().status;
    const as = this.asistenciaState().status;
    return hs === 'idle' || hs === 'loading' || as === 'idle' || as === 'loading';
  });

  readonly horarioVigente = computed((): HorarioMesVigenciaResponse | null => {
    const data = this.horariosState().data;
    return data.length ? data[data.length - 1] : null;
  });

  private readonly asistenciaDias = computed(() => this.asistenciaState().data ?? []);

  readonly horarioDias = computed((): HorarioDiaVm[] => {
    const horario = this.horarioVigente();
    if (!horario?.detallesBase?.length) return [];
    const order = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const labelMap: Record<string, string> = {
      LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
      JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom'
    };
    return [...horario.detallesBase]
      .sort((a, b) => order.indexOf(this.normDia(a.dia)) - order.indexOf(this.normDia(b.dia)))
      .map(d => ({
        diaNorm: this.normDia(d.dia),
        diaLabel: labelMap[this.normDia(d.dia)] ?? d.dia,
        horaEntrada: d.horaEntrada.substring(0, 5),
        horaSalida: d.horaSalida.substring(0, 5),
        laborable: d.laborable
      }));
  });

  readonly todayDayKey = computed(() => {
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return days[new Date().getDay()];
  });

  readonly diasVm = computed((): DiaAsistenciaVm[] =>
    this.asistenciaDias()
      .filter(d => d.jornadaCerrada || d.horaEntradaAsistencia !== null)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(d => this.toDiaVm(d))
  );

  readonly diasTrabajados = computed(() =>
    this.asistenciaDias().filter(d => d.jornadaCerrada && this.minutosTrabajados(d) > 0).length
  );

  readonly horasAcumuladas = computed(() =>
    this.fmtHoras(
      this.asistenciaDias()
        .filter(d => d.jornadaCerrada)
        .reduce((acc, d) => acc + this.minutosTrabajados(d), 0)
    )
  );

  readonly tardanzas = computed(() =>
    this.asistenciaDias().filter(d => (this.tardanzaMin(d) ?? 0) > 0).length
  );

  readonly porcentajeCumplimiento = computed((): number | null => {
    const cerradas = this.asistenciaDias().filter(d => d.jornadaCerrada && this.minutosObjetivo(d) > 0);
    if (!cerradas.length) return null;
    const totalObj = cerradas.reduce((acc, d) => acc + this.minutosObjetivo(d), 0);
    const totalTrab = cerradas.reduce((acc, d) => acc + this.minutosTrabajados(d), 0);
    return Math.round((totalTrab / totalObj) * 100);
  });

  goToPrevMonth(): void {
    this.monthKey.update(({ anio, mes }) =>
      mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 }
    );
  }

  goToNextMonth(): void {
    if (!this.canGoNext()) return;
    this.monthKey.update(({ anio, mes }) =>
      mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 }
    );
  }

  private tardanzaMin(d: AsistenciaDiaCalendarioResponse): number | null {
    if (!d.horaEntradaAsistencia || !d.horaEntradaEstablecida) return null;
    const at = d.horaEntradaAsistencia.substring(0, 5);
    const pt = d.horaEntradaEstablecida.substring(0, 5);
    if (!at || !pt) return null;
    const [ha, ma] = at.split(':').map(Number);
    const [hp, mp] = pt.split(':').map(Number);
    const diff = ha * 60 + ma - (hp * 60 + mp);
    return diff > 0 ? diff : null;
  }

  private toDiaVm(d: AsistenciaDiaCalendarioResponse): DiaAsistenciaVm {
    const tardMin = this.tardanzaMin(d);
    const balMin = d.jornadaCerrada ? this.minutosTrabajados(d) - this.minutosObjetivo(d) : null;
    return {
      fecha: d.fecha,
      fechaDisplay: this.fmtFecha(d.fecha),
      entradaProgramada: d.horaEntradaEstablecida ? d.horaEntradaEstablecida.substring(0, 5) : '---',
      entradaReal: d.horaEntradaAsistencia ? d.horaEntradaAsistencia.substring(0, 5) : '---',
      isTardanza: tardMin !== null,
      tardanzaLabel: tardMin !== null ? `+${tardMin} min` : '—',
      horasTrabajadas: this.fmtHoras(this.minutosTrabajados(d)),
      balance: balMin !== null ? this.fmtBalance(balMin) : '---',
      balancePositivo: balMin !== null ? balMin >= 0 : null,
      estadoActual: d.jornadaCerrada ? 'CERRADA' : 'PENDIENTE'
    };
  }

  private minutosObjetivo(d: AsistenciaDiaCalendarioResponse): number {
    if (d.tramos?.length) {
      return d.tramos.reduce((total, tramo) => total + (tramo.minutosObjetivo ?? 0), 0);
    }
    return this.minutesBetween(d.horaEntradaEstablecida, d.horaSalidaEstablecida);
  }

  private minutosTrabajados(d: AsistenciaDiaCalendarioResponse): number {
    if (d.tramos?.length) {
      return d.tramos.reduce((total, tramo) => total + (tramo.minutosTrabajados ?? 0), 0);
    }
    return this.minutesBetween(d.horaEntradaAsistencia, d.horaSalidaAsistencia);
  }

  private minutesBetween(start: string | null, end: string | null): number {
    if (!start || !end) return 0;
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    return Math.max(endHour * 60 + endMinute - (startHour * 60 + startMinute), 0);
  }

  private normDia(dia: string): string {
    return dia.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  private fmtFecha(fecha: string): string {
    if (!fecha) return '---';
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  fmtHoras(minutos: number): string {
    if (!minutos) return '0h 00m';
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }

  fmtBalance(minutos: number): string {
    const abs = Math.abs(minutos);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `${minutos >= 0 ? '+' : '-'}${h}h ${m.toString().padStart(2, '0')}m`;
  }
}
