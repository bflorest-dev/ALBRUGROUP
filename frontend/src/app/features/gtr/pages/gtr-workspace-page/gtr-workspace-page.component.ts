import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';

@Component({
  selector: 'app-gtr-workspace-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    ProgressSpinnerModule,
    SelectModule,
    TableModule,
    TagModule
  ],
  providers: [GtrWorkspaceFacade],
  templateUrl: './gtr-workspace-page.component.html',
  styleUrl: './gtr-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrWorkspacePageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(GtrWorkspaceFacade);

  ngOnInit(): void {
    this.facade.start();
  }

  ngOnDestroy(): void {
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
