import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { RecruiterOperationalInboxFacade } from '../../facades/recruiter-operational-inbox.facade';
import { GestionDrawerComponent } from '../../components/gestion-drawer/gestion-drawer.component';

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

  ngOnInit(): void {
    this.facade.initialize();
    this.realtime.watchTopic('/topic/postulaciones')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.handleRealtime());
    this.realtime.watchTopic('/topic/grupos-capacitacion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.refresh());
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
}
