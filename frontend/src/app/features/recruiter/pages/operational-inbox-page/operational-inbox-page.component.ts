import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { RecruiterOperationalInboxFacade } from '../../facades/recruiter-operational-inbox.facade';
import { GestionDrawerComponent } from '../../components/gestion-drawer/gestion-drawer.component';
import { RecruiterPostulantesService } from '../../services/recruiter-postulantes.service';
import { SesionMeetResponse } from '../../../../shared/models/recruitment/sesion-meet-response';

@Component({
  selector: 'app-recruiter-operational-inbox-page',
  imports: [FormsModule, ReactiveFormsModule, GestionDrawerComponent],
  providers: [RecruiterOperationalInboxFacade],
  templateUrl: './operational-inbox-page.component.html',
  styleUrl: './operational-inbox-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalInboxPageComponent implements OnInit {
  protected readonly facade = inject(RecruiterOperationalInboxFacade);
  protected readonly form = this.facade.typifyForm;
  private readonly realtime = inject(RecruitmentRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(RecruiterPostulantesService);
  protected readonly meetAgendaOpen = signal(false);
  protected readonly meetDate = signal(this.today());
  protected readonly meetSessions = signal<SesionMeetResponse[]>([]);
  protected readonly meetLoading = signal(false);
  protected readonly meetError = signal('');

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleRealtime());
    this.realtime.watchTopic('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.refresh());
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.meetAgendaOpen()) this.loadMeetAgenda(); });
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

  protected rowStatusClass(value: string | null | undefined): string {
    return (value ?? 'pendiente').toLowerCase().replace(/_/g, '-');
  }

  protected initials(nombres: string, apellidos: string): string {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected saveLabel(): string {
    if (this.facade.actionState() === 'loading') return 'Procesando…';
    if (this.facade.actionState() === 'success') return 'Listo';
    return 'Guardar tipificación';
  }

  protected toggleMeetAgenda(): void {
    this.meetAgendaOpen.update(open => !open);
    if (this.meetAgendaOpen()) this.loadMeetAgenda();
  }

  protected changeMeetDate(value: string): void {
    this.meetDate.set(value);
    this.loadMeetAgenda();
  }

  protected loadMeetAgenda(): void {
    this.meetLoading.set(true);
    this.meetError.set('');
    this.api.listarSesionesMeet(this.meetDate()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: sessions => { this.meetSessions.set(sessions); this.meetLoading.set(false); },
      error: () => { this.meetSessions.set([]); this.meetLoading.set(false); this.meetError.set('No se pudo cargar la agenda Meet.'); }
    });
  }

  protected meetHour(session: SesionMeetResponse): string {
    return new Date(session.fechaHoraInicio).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
  }

  private today(): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
