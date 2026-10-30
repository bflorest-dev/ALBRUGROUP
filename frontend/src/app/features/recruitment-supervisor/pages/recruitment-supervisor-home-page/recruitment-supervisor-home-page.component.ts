import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { GrupoCapacitacionRealtimeEvent } from '../../../../shared/models/recruitment/grupo-capacitacion-realtime-event';
import { OfertaLaboralRealtimeEvent } from '../../../../shared/models/recruitment/oferta-laboral-realtime-event';
import { RecruitmentSupervisorFacade } from '../../facades/recruitment-supervisor.facade';

@Component({
  selector: 'app-recruitment-supervisor-home-page',
  imports: [FormsModule, ReactiveFormsModule],
  providers: [RecruitmentSupervisorFacade],
  templateUrl: './recruitment-supervisor-home-page.component.html',
  styleUrl: './recruitment-supervisor-home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentSupervisorHomePageComponent implements OnInit {
  protected readonly facade = inject(RecruitmentSupervisorFacade);
  protected readonly form = this.facade.form;
  protected readonly puestoObjetivoOptions = [
    { value: 'ASESOR_VENTAS', label: 'Asesor de ventas' },
    { value: 'SUPERVISOR_VENTAS', label: 'Supervisor de ventas' },
    { value: 'ASESOR_POSTVENTA', label: 'Asesor de postventa' },
    { value: 'SUPERVISOR_POSTVENTA', label: 'Supervisor de postventa' },
    { value: 'ASESOR_BACKOFFICE', label: 'Asesor de backoffice' },
    { value: 'SUPERVISOR_BACKOFFICE', label: 'Supervisor de backoffice' },
    { value: 'ASESOR_GTR', label: 'Asesor GTR' },
    { value: 'SUPERVISOR_GTR', label: 'Supervisor GTR' },
    { value: 'RRHH', label: 'RRHH' },
    { value: 'RECLUTADOR', label: 'Reclutador' },
    { value: 'CAPACITADOR', label: 'Capacitador' },
    { value: 'DESARROLLADOR', label: 'Desarrollador' },
    { value: 'CONTADOR', label: 'Contador' },
    { value: 'COMMUNITY', label: 'Community' },
    { value: 'MONITOR', label: 'Monitor' }
  ] as const;
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly lastSync = signal(new Date());

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.lastSync.set(new Date());
        this.facade.handleRealtime();
      });
    this.realtime.watchTopic<OfertaLaboralRealtimeEvent>('/topic/ofertas-laborales')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleCatalogRealtime());
    this.realtime.watchTopic<GrupoCapacitacionRealtimeEvent>('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleCatalogRealtime());
  }

  protected label(value: string | null | undefined): string {
    return this.facade.label(value);
  }

  protected date(value: string | null | undefined): string {
    return this.facade.date(value);
  }

  protected dateTime(value: string | null | undefined): string {
    return this.facade.dateTime(value);
  }

  protected openDetail(row: Parameters<RecruitmentSupervisorFacade['openDetail']>[0]): void {
    this.facade.openDetail(row);
  }

  protected displayName(postulante: { nombres?: string | null; apellidos?: string | null; usuarioMeta?: string | null }): string {
    const name = [postulante.nombres, postulante.apellidos].filter(Boolean).join(' ').trim();
    return name || (postulante.usuarioMeta ? `@${postulante.usuarioMeta.replace(/^@+/, '')}` : 'Postulante sin nombre');
  }

  protected initials(nombres?: string | null, apellidos?: string | null, usuarioMeta?: string | null): string {
    const first = nombres?.trim()?.[0] ?? '';
    const last = apellidos?.trim()?.[0] ?? '';
    const meta = usuarioMeta?.replace(/^@+/, '').trim();
    return (first + last || meta?.slice(0, 2) || '?').toUpperCase();
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected saveLabel(): string {
    if (this.facade.actionState() === 'loading') return 'Procesando…';
    if (this.facade.isMetaRegistration()) return 'Crear alta Meta';
    return this.facade.isEditing() ? 'Guardar correcciones' : 'Registrar postulante';
  }

  protected rowStatusClass(value: string | null | undefined): string {
    return (value ?? 'pendiente').toLowerCase().replace(/_/g, '-');
  }

  protected eventIcon(action: string | null | undefined): string {
    const normalized = action?.toUpperCase() ?? '';
    if (normalized.includes('CONTACT')) return 'ti ti-phone-call';
    if (normalized.includes('UPDATE') || normalized.includes('CORREC')) return 'ti ti-pencil';
    if (normalized.includes('CAPACIT')) return 'ti ti-school';
    return 'ti ti-circle-check';
  }
}
