import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SupervisorGtrOperativoFacade } from '../../facades/supervisor-gtr-operativo.facade';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';

@Component({
  selector: 'app-supervisor-gtr-operativo-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    ButtonModule,
    TableModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    PhoneNumberFieldComponent
  ],
  providers: [SupervisorGtrOperativoFacade],
  templateUrl: './supervisor-gtr-operativo-page.component.html',
  styleUrl: './supervisor-gtr-operativo-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorGtrOperativoPageComponent implements OnInit {
  protected readonly facade = inject(SupervisorGtrOperativoFacade);

  ngOnInit(): void {
    void this.facade.inicializar();
  }

  protected onPageChange(event: { first?: number | null; rows?: number | null }): void {
    const page = event.first != null && event.rows ? Math.floor(event.first / event.rows) : 0;
    void this.facade.cargarLeadsSinEquipo(page);
  }
}
