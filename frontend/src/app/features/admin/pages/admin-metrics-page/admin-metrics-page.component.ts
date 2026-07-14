import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { GestionCampanaPanelComponent } from '../../components/gestion-campana-panel/gestion-campana-panel.component';
import { AdminDailyMetricsService, LeadsDiariosMetricasEquipo } from '../../services/admin-daily-metrics.service';
import { AdminEquipoService } from '../../services/admin-equipo.service';

const SIN_EQUIPO = 'Sin equipo';

interface DashboardMetricRow {
  idEquipo: number | null;
  equipo: string;
  registros: number; // A
  leadsUnicos: number; // B
  repetidos: number; // C
  porcentaje: number; // E
  leadsRepetidos: number; // D
  tipificados: number; // F
  bloque1: number;
  bloque2: number;
  bloque3: number; // G
  ventaCerrada: number; // H
}

/** DASHBOARD del ADMIN: métricas del día de "Leads del día" desglosadas por equipo. */
@Component({
  selector: 'app-admin-metrics-page',
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    DateFieldComponent,
    GestionCampanaPanelComponent
  ],
  templateUrl: './admin-metrics-page.component.html',
  styleUrl: './admin-metrics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMetricsPageComponent implements OnInit {
  private readonly metricsService = inject(AdminDailyMetricsService);
  private readonly equipoService = inject(AdminEquipoService);

  protected readonly fecha = signal('');
  protected readonly maxDate = this.localToday();
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  private readonly raw = signal<LeadsDiariosMetricasEquipo[]>([]);
  private readonly equipos = signal<Array<{ id: number; nombre: string; activo: boolean }>>([]);
  private readonly equipoNombreById = signal<Map<number, string>>(new Map());
  protected readonly selectedEquipoId = signal<number | null>(null);

  protected readonly equipoOptions = computed(() => [
    { label: 'Todos los equipos', value: null as number | null },
    ...this.equipos()
      .filter((equipo) => equipo.activo !== false)
      .map((equipo) => ({ label: equipo.nombre, value: equipo.id }))
      .sort((left, right) => left.label.localeCompare(right.label))
  ]);

  protected readonly rows = computed<DashboardMetricRow[]>(() => {
    const nombres = this.equipoNombreById();
    const selectedEquipoId = this.selectedEquipoId();
    return this.raw()
      .filter((metrica) => selectedEquipoId === null || metrica.idEquipo === selectedEquipoId)
      .map((metrica) => this.toRow(metrica, nombres))
      .sort((left, right) => {
        if (left.equipo === SIN_EQUIPO) return 1;
        if (right.equipo === SIN_EQUIPO) return -1;
        return left.equipo.localeCompare(right.equipo);
      });
  });

  protected readonly total = computed<DashboardMetricRow | null>(() => {
    const rows = this.rows();
    if (!rows.length) {
      return null;
    }
    const acc = rows.reduce(
      (sum, row) => ({
        registros: sum.registros + row.registros,
        leadsUnicos: sum.leadsUnicos + row.leadsUnicos,
        repetidos: sum.repetidos + row.repetidos,
        leadsRepetidos: sum.leadsRepetidos + row.leadsRepetidos,
        tipificados: sum.tipificados + row.tipificados,
        bloque1: sum.bloque1 + row.bloque1,
        bloque2: sum.bloque2 + row.bloque2,
        bloque3: sum.bloque3 + row.bloque3,
        ventaCerrada: sum.ventaCerrada + row.ventaCerrada
      }),
      { registros: 0, leadsUnicos: 0, repetidos: 0, leadsRepetidos: 0, tipificados: 0, bloque1: 0, bloque2: 0, bloque3: 0, ventaCerrada: 0 }
    );
    return {
      idEquipo: null,
      equipo: 'Total',
      ...acc,
      porcentaje: acc.registros > 0 ? (acc.leadsUnicos / acc.registros) * 100 : 0
    };
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async onFechaChange(value: string): Promise<void> {
    this.fecha.set(value || '');
    await this.load();
  }

  protected onEquipoChange(value: number | null): void {
    this.selectedEquipoId.set(value ?? null);
  }

  protected async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const [metricas, equipos] = await Promise.all([
        firstValueFrom(this.metricsService.obtenerPorEquipo(this.fecha() || undefined)),
        firstValueFrom(this.equipoService.listarEquipos())
      ]);
      this.equipos.set(equipos);
      this.equipoNombreById.set(new Map(equipos.map((equipo) => [equipo.id, equipo.nombre])));
      this.raw.set(metricas);
    } catch {
      this.errorMessage.set('No se pudieron cargar las métricas del día.');
      this.raw.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private toRow(metrica: LeadsDiariosMetricasEquipo, nombres: Map<number, string>): DashboardMetricRow {
    const equipo =
      metrica.idEquipo == null ? SIN_EQUIPO : nombres.get(metrica.idEquipo) ?? `Equipo ${metrica.idEquipo}`;
    return {
      idEquipo: metrica.idEquipo,
      equipo,
      registros: metrica.registros,
      leadsUnicos: metrica.leadsUnicos,
      repetidos: Math.max(0, metrica.registros - metrica.leadsUnicos),
      porcentaje: metrica.registros > 0 ? (metrica.leadsUnicos / metrica.registros) * 100 : 0,
      leadsRepetidos: metrica.leadsRepetidos,
      tipificados: metrica.leadsTipificados,
      bloque1: metrica.bloqueOrden1,
      bloque2: metrica.bloqueOrden2,
      bloque3: metrica.bloqueOrden3,
      ventaCerrada: metrica.leadsVentaCerrada
    };
  }

  private localToday(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
