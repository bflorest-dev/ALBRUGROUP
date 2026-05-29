import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-workspace-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    PaginatorModule,
    PopoverModule,
    ProgressSpinnerModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TagModule,
    DateFieldComponent,
    PhoneNumberFieldComponent
  ],
  providers: [GtrWorkspaceFacade],
  templateUrl: './gtr-workspace-page.component.html',
  styleUrl: './gtr-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrWorkspacePageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(GtrWorkspaceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly routeSubscription = new Subscription();

  ngOnInit(): void {
    this.routeSubscription.add(
      this.route.data.subscribe((data) => {
        const section = data['section'];
        if (section === 'plataforma' || section === 'agendados' || section === 'historicos') {
          this.facade.setSection(section);
        }
      })
    );
    this.facade.start();
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.facade.stop();
  }

  protected estadoSeverity(value: string | null | undefined): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (value) {
      case 'NUEVO':
        return 'info';
      case 'ASIGNADO':
        return 'warn';
      case 'EN_GESTION':
      case 'AGENDADO':
        return 'secondary';
      case 'GESTIONADO':
        return 'success';
      default:
        return 'secondary';
    }
  }

  protected advisorSeverity(value: string | null | undefined): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (value) {
      case 'DISPONIBLE':
        return 'success';
      case 'GESTIONANDO':
        return 'warn';
      case 'OCUPADO':
        return 'secondary';
      case 'SATURADO':
      case 'SIN_PRESENCIA':
      case 'OFFLINE':
        return 'danger';
      default:
        return 'info';
    }
  }
}
