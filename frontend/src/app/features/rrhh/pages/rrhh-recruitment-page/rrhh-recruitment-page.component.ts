import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { ApiErrorResponse } from '../../../../shared/models/api/api-error-response';
import { PostulantRegistrationDrawerComponent, RegistrationDrawerActionState } from '../../../../shared/components/postulant-registration-drawer/postulant-registration-drawer.component';
import { AltaMetaPostulacionRequest } from '../../../../shared/models/recruitment/alta-meta-postulacion-request';
import { OfertaLaboralResponse } from '../../../../shared/models/recruitment/oferta-laboral-response';
import { PostulacionRequest } from '../../../../shared/models/recruitment/postulacion-request';
import { RecruitmentNegocio } from '../../../../core/services/current-user-recruitment-negocio-scope.service';
import { RecruitmentPostulacionService } from '../../../../core/services/recruitment-postulacion.service';

@Component({
  selector: 'app-rrhh-recruitment-page',
  imports: [PostulantRegistrationDrawerComponent],
  templateUrl: './rrhh-recruitment-page.component.html',
  styleUrl: './rrhh-recruitment-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhRecruitmentPageComponent {
  private readonly service = inject(RecruitmentPostulacionService);
  private readonly requestTimeoutMs = 15000;

  protected readonly drawerVisible = signal(false);
  protected readonly offers = signal<OfertaLaboralResponse[]>([]);
  protected readonly selectedNegocio = signal<RecruitmentNegocio>('WIN');
  protected readonly catalogLoading = signal(false);
  protected readonly catalogError = signal('');
  protected readonly actionState = signal<RegistrationDrawerActionState>('idle');
  protected readonly actionError = signal('');
  protected readonly successMessage = signal('');

  protected openRegister(): void {
    this.successMessage.set('');
    this.actionError.set('');
    this.actionState.set('idle');
    this.drawerVisible.set(true);
    this.loadOffers(this.selectedNegocio());
  }

  protected closeDrawer(): void {
    if (this.actionState() === 'loading') return;
    this.drawerVisible.set(false);
    this.actionError.set('');
    this.actionState.set('idle');
  }

  protected onBusinessChanged(negocio: RecruitmentNegocio): void {
    this.selectedNegocio.set(negocio);
    if (this.drawerVisible()) this.loadOffers(negocio);
  }

  protected registerFull(request: PostulacionRequest): void {
    this.submit(() => this.service.registrarPostulacion(request), 'Postulante registrado');
  }

  protected registerMeta(request: AltaMetaPostulacionRequest): void {
    this.submit(() => this.service.registrarPostulacionRapidaMeta(request), 'Postulante Meta registrado');
  }

  private loadOffers(negocio: RecruitmentNegocio): void {
    this.catalogLoading.set(true);
    this.catalogError.set('');
    this.service.listarOfertasActivas(negocio).pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: (offers) => {
        this.offers.set(offers);
        this.catalogLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.offers.set([]);
        this.catalogLoading.set(false);
        this.catalogError.set(this.errorMessage(error, 'No fue posible cargar las ofertas activas.'));
      }
    });
  }

  private submit<T>(request$: () => import('rxjs').Observable<T>, successMessage: string): void {
    if (this.actionState() === 'loading') return;
    this.actionState.set('loading');
    this.actionError.set('');
    this.successMessage.set('');
    request$().pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: () => {
        this.actionState.set('success');
        this.successMessage.set(successMessage);
        this.drawerVisible.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.actionState.set('error');
        this.actionError.set(this.errorMessage(error, 'No fue posible registrar el postulante.'));
      }
    });
  }

  private errorMessage(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    if (apiError?.details?.length) return `${apiError.message}: ${apiError.details.join(', ')}`;
    return apiError?.message ?? fallback;
  }
}
