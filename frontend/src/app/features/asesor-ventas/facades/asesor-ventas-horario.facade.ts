import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { DetalleAsistenciaResponse } from '../../../shared/models/schedule/detalle-asistencia-response';
import { HorarioResponse } from '../../../shared/models/schedule/horario-response';

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
          map(data => ({ status: 'success' as DataStatus, data })),
          startWith({ status: 'loading' as DataStatus, data: [] as HorarioResponse[] }),
          catchError(() => of({ status: 'error' as DataStatus, data: [] as HorarioResponse[] }))
        )
      )
    ),
    { initialValue: { status: 'idle' as DataStatus, data: [] as HorarioResponse[] } }
  );

  private readonly asistenciaState = toSignal(
    toObservable(this.monthKey).pipe(
      switchMap(({ anio, mes }) =>
        this.attendanceService.getAsistenciaMes(anio, mes).pipe(
          map(data => ({ status: 'success' as DataStatus, data })),
          startWith({ status: 'loading' as DataStatus, data: [] as DetalleAsistenciaResponse[] }),
          catchError(() => of({ status: 'error' as DataStatus, data: [] as DetalleAsistenciaResponse[] }))
        )
      )
    ),
    { initialValue: { status: 'idle' as DataStatus, data: [] as DetalleAsistenciaResponse[] } }
  );

  readonly isLoading = computed(() => {
    const hs = this.horariosState().status;
    const as = this.asistenciaState().status;
    return hs === 'idle' || hs === 'loading' || as === 'idle' || as === 'loading';
  });

  readonly horarioVigente = computed((): HorarioResponse | null => {
    const data = this.horariosState().data;
    return data.length ? data[data.length - 1] : null;
  });

  private readonly asistenciaDias = computed(() => this.asistenciaState().data ?? []);

  readonly horarioDias = computed((): HorarioDiaVm[] => {
    const horario = this.horarioVigente();
    if (!horario?.detalles?.length) return [];
    const order = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    const labelMap: Record<string, string> = {
      LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
      JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom'
    };
    return [...horario.detalles]
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
      .filter(d => d.jornadaCerrada || d.fechaHoraIngreso !== null)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(d => this.toDiaVm(d))
  );

  readonly diasTrabajados = computed(() =>
    this.asistenciaDias().filter(d => d.jornadaCerrada && (d.minutosTrabajados ?? 0) > 0).length
  );

  readonly horasAcumuladas = computed(() =>
    this.fmtHoras(
      this.asistenciaDias()
        .filter(d => d.jornadaCerrada)
        .reduce((acc, d) => acc + (d.minutosTrabajados ?? 0), 0)
    )
  );

  readonly tardanzas = computed(() =>
    this.asistenciaDias().filter(d => (this.tardanzaMin(d) ?? 0) > 0).length
  );

  readonly porcentajeCumplimiento = computed((): number | null => {
    const cerradas = this.asistenciaDias().filter(d => d.jornadaCerrada && (d.minutosObjetivoDia ?? 0) > 0);
    if (!cerradas.length) return null;
    const totalObj = cerradas.reduce((acc, d) => acc + (d.minutosObjetivoDia ?? 0), 0);
    const totalTrab = cerradas.reduce((acc, d) => acc + (d.minutosTrabajados ?? 0), 0);
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

  private tardanzaMin(d: DetalleAsistenciaResponse): number | null {
    if (!d.fechaHoraIngreso || !d.entradaProgramada) return null;
    const at = d.fechaHoraIngreso.split('T')[1]?.substring(0, 5) ?? '';
    const pt = d.entradaProgramada.substring(0, 5);
    if (!at || !pt) return null;
    const [ha, ma] = at.split(':').map(Number);
    const [hp, mp] = pt.split(':').map(Number);
    const diff = ha * 60 + ma - (hp * 60 + mp);
    return diff > 0 ? diff : null;
  }

  private toDiaVm(d: DetalleAsistenciaResponse): DiaAsistenciaVm {
    const tardMin = this.tardanzaMin(d);
    const balMin = d.minutosBalance ?? null;
    return {
      fecha: d.fecha,
      fechaDisplay: this.fmtFecha(d.fecha),
      entradaProgramada: d.entradaProgramada ? d.entradaProgramada.substring(0, 5) : '---',
      entradaReal: d.fechaHoraIngreso ? (d.fechaHoraIngreso.split('T')[1]?.substring(0, 5) ?? '---') : '---',
      isTardanza: tardMin !== null,
      tardanzaLabel: tardMin !== null ? `+${tardMin} min` : '—',
      horasTrabajadas: this.fmtHoras(d.minutosTrabajados ?? 0),
      balance: balMin !== null ? this.fmtBalance(balMin) : '---',
      balancePositivo: balMin !== null ? balMin >= 0 : null,
      estadoActual: d.estadoActual
    };
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
