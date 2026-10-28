import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import {
  CategoriaGasto,
  Gasto,
  GastoPayload,
  GastosGeneralesService,
  GrupoGasto,
  GrupoGastoPayload,
  ResumenGastosMensual,
  TipoGasto,
  TipoGastoPayload
} from '../../services/gastos-generales.service';

@Component({
  selector: 'app-admin-gastos-generales-page',
  imports: [
    DecimalPipe,
    UpperCasePipe,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    FloatLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    TagModule,
    ToastModule,
    TooltipModule,
    PageHeaderComponent
  ],
  providers: [MessageService],
  templateUrl: './admin-gastos-generales-page.component.html',
  styleUrl: './admin-gastos-generales-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminGastosGeneralesPageComponent {
  private readonly svc = inject(GastosGeneralesService);
  private readonly msg = inject(MessageService);

  // ── State ──
  protected readonly activeTab = signal('resumen');
  protected readonly loading = signal(false);

  // Grupos
  protected readonly grupos = signal<GrupoGasto[]>([]);
  protected readonly showGrupoDialog = signal(false);
  protected readonly editingGrupo = signal<GrupoGasto | null>(null);
  protected readonly grupoForm = signal<GrupoGastoPayload>({ nombre: '', orden: 0 });

  // Tipos
  protected readonly tipos = signal<TipoGasto[]>([]);
  protected readonly showTipoDialog = signal(false);
  protected readonly editingTipo = signal<TipoGasto | null>(null);
  protected readonly tipoForm = signal<TipoGastoPayload>({ idGrupoGasto: 0, nombre: '', categoria: 'FIJO' });

  protected readonly categoriaOptions: { label: string; value: CategoriaGasto }[] = [
    { label: 'Fijo', value: 'FIJO' },
    { label: 'Variable', value: 'VARIABLE' }
  ];

  protected readonly grupoOptions = computed(() =>
    this.grupos().map(g => ({ label: g.nombre, value: g.id }))
  );

  // Gastos
  protected readonly gastos = signal<Gasto[]>([]);
  protected readonly showGastoDialog = signal(false);
  protected readonly editingGasto = signal<Gasto | null>(null);
  protected readonly gastoForm = signal<GastoPayload>({ idTipoGasto: 0, monto: 0, fecha: '' });
  protected readonly filtroTipoGasto = signal<number | null>(null);
  protected readonly gastoFechaDesde = signal<Date>(this.firstDayOfMonth());
  protected readonly gastoFechaHasta = signal<Date>(new Date());

  protected readonly tiposActivosOptions = computed(() =>
    this.tipos().filter(t => t.activo).map(t => ({ label: `${t.grupo.nombre} / ${t.nombre}`, value: t.id }))
  );

  // Resumen
  protected readonly resumen = signal<ResumenGastosMensual | null>(null);
  protected readonly resumenDate = signal<Date>(new Date());

  protected readonly resumenAnio = computed(() => this.resumenDate().getFullYear());
  protected readonly resumenMes = computed(() => this.resumenDate().getMonth() + 1);

  constructor() {
    this.cargarGrupos();
    this.cargarTipos();
    this.cargarResumen();
  }

  // ── Tab change ──

  onTabChange(tab: string | number | undefined): void {
    if (tab == null) return;
    const t = String(tab);
    this.activeTab.set(t);
    if (t === 'config') {
      this.cargarGrupos();
      this.cargarTipos();
    } else if (t === 'gastos') {
      this.cargarGastos();
    } else if (t === 'resumen') {
      this.cargarResumen();
    }
  }

  // ── Grupos CRUD ──

  cargarGrupos(): void {
    this.svc.listarGrupos().subscribe(g => this.grupos.set(g));
  }

  abrirNuevoGrupo(): void {
    this.editingGrupo.set(null);
    this.grupoForm.set({ nombre: '', orden: this.grupos().length });
    this.showGrupoDialog.set(true);
  }

  abrirEditarGrupo(g: GrupoGasto): void {
    this.editingGrupo.set(g);
    this.grupoForm.set({ nombre: g.nombre, orden: g.orden });
    this.showGrupoDialog.set(true);
  }

  guardarGrupo(): void {
    const form = this.grupoForm();
    const editing = this.editingGrupo();
    const obs = editing
      ? this.svc.editarGrupo(editing.id, form)
      : this.svc.crearGrupo(form);

    obs.subscribe({
      next: () => {
        this.showGrupoDialog.set(false);
        this.cargarGrupos();
        this.msg.add({ severity: 'success', summary: editing ? 'Grupo actualizado' : 'Grupo creado' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al guardar grupo' })
    });
  }

  eliminarGrupo(g: GrupoGasto): void {
    this.svc.eliminarGrupo(g.id).subscribe({
      next: () => {
        this.cargarGrupos();
        this.msg.add({ severity: 'success', summary: 'Grupo eliminado' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' })
    });
  }

  // ── Tipos CRUD ──

  cargarTipos(): void {
    this.svc.listarTipos().subscribe(t => this.tipos.set(t));
  }

  abrirNuevoTipo(): void {
    this.editingTipo.set(null);
    this.tipoForm.set({ idGrupoGasto: this.grupos()[0]?.id ?? 0, nombre: '', categoria: 'FIJO' });
    this.showTipoDialog.set(true);
  }

  abrirEditarTipo(t: TipoGasto): void {
    this.editingTipo.set(t);
    this.tipoForm.set({ idGrupoGasto: t.grupo.id, nombre: t.nombre, categoria: t.categoria });
    this.showTipoDialog.set(true);
  }

  guardarTipo(): void {
    const form = this.tipoForm();
    const editing = this.editingTipo();
    const obs = editing
      ? this.svc.editarTipo(editing.id, form)
      : this.svc.crearTipo(form);

    obs.subscribe({
      next: () => {
        this.showTipoDialog.set(false);
        this.cargarTipos();
        this.msg.add({ severity: 'success', summary: editing ? 'Tipo actualizado' : 'Tipo creado' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al guardar tipo' })
    });
  }

  desactivarTipo(t: TipoGasto): void {
    this.svc.desactivarTipo(t.id).subscribe({
      next: () => {
        this.cargarTipos();
        this.msg.add({ severity: 'success', summary: 'Tipo desactivado' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' })
    });
  }

  // ── Gastos CRUD ──

  cargarGastos(): void {
    const desde = this.formatDate(this.gastoFechaDesde());
    const hasta = this.formatDate(this.gastoFechaHasta());
    const filtro = this.filtroTipoGasto() ?? undefined;
    this.svc.listarGastos(desde, hasta, filtro).subscribe(g => this.gastos.set(g));
  }

  abrirNuevoGasto(): void {
    this.editingGasto.set(null);
    this.gastoForm.set({ idTipoGasto: 0, monto: 0, fecha: this.formatDate(new Date()) });
    this.showGastoDialog.set(true);
  }

  abrirEditarGasto(g: Gasto): void {
    this.editingGasto.set(g);
    this.gastoForm.set({
      idTipoGasto: g.idTipoGasto,
      monto: g.monto,
      documento: g.documento ?? undefined,
      descripcion: g.descripcion ?? undefined,
      fecha: g.fecha
    });
    this.showGastoDialog.set(true);
  }

  guardarGasto(): void {
    const form = this.gastoForm();
    const editing = this.editingGasto();
    const obs = editing
      ? this.svc.editarGasto(editing.id, form)
      : this.svc.crearGasto(form);

    obs.subscribe({
      next: () => {
        this.showGastoDialog.set(false);
        this.cargarGastos();
        this.msg.add({ severity: 'success', summary: editing ? 'Gasto actualizado' : 'Gasto registrado' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al guardar gasto' })
    });
  }

  eliminarGasto(g: Gasto): void {
    this.svc.eliminarGasto(g.id).subscribe({
      next: () => {
        this.cargarGastos();
        this.msg.add({ severity: 'success', summary: 'Gasto eliminado' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' })
    });
  }

  // ── Resumen ──

  cargarResumen(): void {
    this.loading.set(true);
    this.svc.resumenMensual(this.resumenAnio(), this.resumenMes()).subscribe({
      next: (r) => { this.resumen.set(r); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  onResumenDateChange(date: Date): void {
    this.resumenDate.set(date);
    this.cargarResumen();
  }

  // ── Helpers ──

  private formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private firstDayOfMonth(): Date {
    const d = new Date();
    d.setDate(1);
    return d;
  }
}
