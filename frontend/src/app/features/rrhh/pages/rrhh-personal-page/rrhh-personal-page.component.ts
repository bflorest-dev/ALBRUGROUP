import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ContractRenewalDialogComponent } from '../../../admin/components/contract-renewal-dialog/contract-renewal-dialog.component';
import { EmployeeAccessPanelComponent } from '../../../admin/components/employee-access-panel/employee-access-panel.component';
import { PersonalDataEditDialogComponent } from '../../../admin/components/personal-data-edit-dialog/personal-data-edit-dialog.component';
import { PersonalRegistrationPanelComponent } from '../../../admin/components/personal-registration-panel/personal-registration-panel.component';
import { AdminPersonalFacade } from '../../../admin/facades/admin-personal.facade';

@Component({
  selector: 'app-rrhh-personal-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    MessageModule,
    TableModule,
    TagModule,
    ToggleButtonModule,
    PersonalRegistrationPanelComponent,
    EmployeeAccessPanelComponent,
    ContractRenewalDialogComponent,
    PersonalDataEditDialogComponent
  ],
  providers: [AdminPersonalFacade],
  templateUrl: './rrhh-personal-page.component.html',
  styleUrl: './rrhh-personal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RrhhPersonalPageComponent implements OnInit {
  protected readonly facade = inject(AdminPersonalFacade);
  protected readonly activeSection = signal<'activos' | 'alta'>('activos');

  ngOnInit(): void {
    this.facade.initialize();
  }

  private readonly pickerDateCache = new Map<string, Date | null>();

  protected toPickerDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== 'string' || !value) {
      return null;
    }

    const cached = this.pickerDateCache.get(value);
    if (cached !== undefined) {
      return cached;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const parsed = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
    this.pickerDateCache.set(value, parsed);
    return parsed;
  }

  protected setHorarioDate(value: Date | string | null): void {
    this.facade.horarioForm.controls.fechaInicio.setValue(this.toBackendDate(value));
    this.facade.horarioForm.controls.fechaInicio.markAsTouched();
    this.facade.horarioForm.controls.fechaInicio.markAsDirty();
  }

  protected isCompensable(): boolean {
    return this.facade.horarioForm.controls.compensable.getRawValue() === 'true';
  }

  protected setCompensable(enabled: boolean): void {
    this.facade.horarioForm.controls.compensable.setValue(String(enabled));
  }

  protected isRestDay(day: string): boolean {
    return this.facade.horarioForm.controls.diaDescanso.getRawValue() === day;
  }

  protected selectRestDay(day: string): void {
    this.facade.horarioForm.controls.diaDescanso.setValue(day);
    this.applySimpleSchedule();
  }

  protected usesLunchBreak(): boolean {
    const modalidad = this.facade.currentContractForScheduleChange()?.modalidad;
    return modalidad !== 'PART_TIME' && modalidad !== 'SEMI_FULL';
  }

  protected applySimpleSchedule(): void {
    const raw = this.facade.horarioForm.getRawValue();
    for (const row of this.facade.horarioForm.controls.detalles.controls) {
      row.patchValue({
        horaEntrada: raw.horaEntrada,
        horaSalida: raw.horaSalida,
        inicioAlmuerzo: this.usesLunchBreak() ? raw.inicioAlmuerzo : '',
        finAlmuerzo: this.usesLunchBreak() ? raw.finAlmuerzo : '',
        laborable: row.controls.dia.getRawValue() === raw.diaDescanso ? 'false' : 'true'
      });
    }
  }

  protected scheduleValidationMessage(): string | null {
    const error = this.facade.horarioForm.errors?.['scheduleRule'] as { message?: string } | undefined;
    return error?.message && (this.facade.horarioForm.touched || this.facade.horarioForm.dirty) ? error.message : null;
  }

  private toBackendDate(value: Date | string | null): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const month = `${value.getMonth() + 1}`.padStart(2, '0');
      const day = `${value.getDate()}`.padStart(2, '0');
      return `${value.getFullYear()}-${month}-${day}`;
    }

    return typeof value === 'string' ? value : '';
  }
}
