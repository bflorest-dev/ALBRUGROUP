import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ReporteAsistenciaService, FilaReporteAsistencia } from '../../services/reporte-asistencia.service';

@Component({
  selector: 'app-reporte-asistencia-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-asistencia-page.component.html',
  styleUrls: ['./reporte-asistencia-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReporteAsistenciaPageComponent {
  private readonly service = inject(ReporteAsistenciaService);

  private readonly THEME_KEY = 'reporteAsistencia-theme';
  protected readonly theme = signal<'light' | 'dark'>('dark');

  protected readonly anio = signal(new Date().getFullYear());
  protected readonly mes = signal(new Date().getMonth() + 1);
  protected readonly loading = signal(false);
  protected readonly filas = signal<FilaReporteAsistencia[]>([]);

  protected readonly diasDelMes = computed(() => {
    const d = new Date(this.anio(), this.mes(), 0).getDate();
    return Array.from({ length: d }, (_, i) => i + 1);
  });

  protected readonly diasSemana = computed(() => {
    return this.diasDelMes().map(dia => {
      const d = new Date(this.anio(), this.mes() - 1, dia);
      return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()];
    });
  });

  protected readonly meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  constructor() {
    try {
      const saved = localStorage.getItem(this.THEME_KEY);
      if (saved === 'light' || saved === 'dark') this.theme.set(saved);
    } catch {}
    this.cargar();
  }

  protected toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    try { localStorage.setItem(this.THEME_KEY, next); } catch {}
  }

  protected cargar(): void {
    this.loading.set(true);
    this.service.cargar(this.anio(), this.mes()).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(data => this.filas.set(data));
  }

  protected recalcular(): void {
    const ids = this.filas().map(f => f.empleado.idEmpleado);
    if (!ids.length) return;
    this.loading.set(true);
    this.service.recalcular(this.anio(), this.mes(), ids).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(() => this.cargar());
  }

  protected estadoLetra(estado: string | null): string {
    if (!estado) return '';
    switch (estado) {
      case 'P': return 'P';
      case 'T': case 'TC': case 'TJ': return 'T';
      case 'F': return 'F';
      case 'NL': return 'D';
      default: return '';
    }
  }

  protected estadoClase(estado: string | null): string {
    if (!estado) return '';
    switch (estado) {
      case 'P': return 'st-p';
      case 'T': case 'TC': case 'TJ': return 'st-t';
      case 'F': return 'st-f';
      case 'NL': return 'st-d';
      default: return '';
    }
  }

  protected contarEstado(fila: FilaReporteAsistencia, tipo: 'tardanza' | 'falta'): number {
    if (!fila.resumen) return 0;
    if (tipo === 'tardanza') {
      return fila.resumen.diasTardanza + fila.resumen.diasTardanzaCompensable + fila.resumen.diasTardanzaJustificada;
    }
    return fila.resumen.diasFalta;
  }

  protected formatFecha(fecha: string | null): string {
    if (!fecha) return '-';
    const d = new Date(fecha + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  protected formatModalidad(m: string | null): string {
    if (!m) return '-';
    return m.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }

  protected cambiarMes(delta: number): void {
    let m = this.mes() + delta;
    let a = this.anio();
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    this.mes.set(m);
    this.anio.set(a);
    this.cargar();
  }
}
