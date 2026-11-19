import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { GrupoCapacitacionRealtimeEvent } from '../../../../shared/models/recruitment/grupo-capacitacion-realtime-event';
import { OfertaLaboralRealtimeEvent } from '../../../../shared/models/recruitment/oferta-laboral-realtime-event';
import { PostulantRegistrationDrawerComponent } from '../../../../shared/components/postulant-registration-drawer/postulant-registration-drawer.component';
import { RecruitmentSupervisorFacade } from '../../facades/recruitment-supervisor.facade';

@Component({
  selector: 'app-recruitment-supervisor-home-page',
  imports: [FormsModule, ReactiveFormsModule, PostulantRegistrationDrawerComponent],
  providers: [RecruitmentSupervisorFacade],
  templateUrl: './recruitment-supervisor-home-page.component.html',
  styleUrl: './recruitment-supervisor-home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentSupervisorHomePageComponent implements OnInit {
  protected readonly facade = inject(RecruitmentSupervisorFacade);
  protected readonly form = this.facade.form;
  protected readonly puestoObjetivoOptions = [
    { value: 'ASESOR_VENTAS', label: 'Asesor de ventas' }
  ] as const;
  protected readonly etapaFilterOptions = [
    { value: '', label: 'Todos' },
    { value: 'RECLUTAMIENTO', label: 'Postulación' },
    { value: 'CAPACITACION', label: 'Capacitación' },
    { value: 'CONTRATACION', label: 'Contratación' }
  ] as const;
  protected readonly estadoFilterOptions = [
    { value: '', label: 'Todos' },
    { value: 'POSTULANTE', label: 'Por revisar' },
    { value: 'SIN_CONTACTO', label: 'Sin contacto' },
    { value: 'EN_GESTION', label: 'En gestión' },
    { value: 'CAPACITACION', label: 'Capacitación' }
  ] as const;
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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

  protected compactDate(value: string | null | undefined): string {
    return this.facade.compactDate(value);
  }

  protected compactDateTime(value: string | null | undefined): string {
    return this.facade.compactDateTime(value);
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

  protected filterLabel(options: ReadonlyArray<{ value: string; label: string }>, value: string): string {
    return options.find(option => option.value === value)?.label ?? options[0].label;
  }

  protected selectEtapa(value: string, menu: HTMLDetailsElement): void {
    this.facade.setEtapaFilter(value);
    menu.open = false;
  }

  protected selectEstado(value: string, menu: HTMLDetailsElement): void {
    this.facade.setEstadoBandejaFilter(value);
    menu.open = false;
  }

  @HostListener('document:click', ['$event'])
  protected closeFilterMenus(event: MouseEvent): void {
    const target = event.target as Node;
    document.querySelectorAll<HTMLDetailsElement>('details.filter-select[open]').forEach(menu => {
      if (!menu.contains(target)) menu.open = false;
    });
  }

  @HostListener('document:keydown.escape')
  protected closeFilterMenusOnEscape(): void {
    document.querySelectorAll<HTMLDetailsElement>('details.filter-select[open]').forEach(menu => menu.open = false);
  }
}
