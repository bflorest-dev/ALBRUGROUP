import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import {
  CommunityWorkspaceFacade,
  PlanDialogMode,
  PlanService,
  PlanType
} from '../../facades/community-workspace.facade';
import { PlanSelectComponent, PlanSelectOption } from './plan-select.component';

@Component({
  selector: 'app-plan-form-dialog',
  imports: [ReactiveFormsModule, ButtonModule, DrawerModule, InputTextModule, MessageModule, PlanSelectComponent],
  templateUrl: './plan-form-dialog.component.html',
  styleUrl: './plan-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanFormDialogComponent {
  protected readonly facade = inject(CommunityWorkspaceFacade);

  @Input({ required: true }) mode!: PlanDialogMode;
  private drawerVisible = false;
  private userChangedForm = false;
  protected showDiscardConfirmation = false;

  @Input()
  set visible(value: boolean) {
    this.drawerVisible = value;
    if (!value) {
      this.userChangedForm = false;
      this.showDiscardConfirmation = false;
    }
  }

  get visible(): boolean {
    return this.drawerVisible;
  }

  protected get form(): FormGroup {
    return this.mode === 'create' ? this.facade.createPlanForm : this.facade.editPlanForm;
  }

  protected get title(): string {
    return this.mode === 'create' ? 'Crear plan' : 'Editar plan';
  }

  protected get submitLabel(): string {
    return this.mode === 'create' ? 'Crear plan' : 'Guardar cambios';
  }

  protected serviceId(service: PlanService): string {
    return `plan-service-${this.mode}-${service}`;
  }

  protected providerOptions(): PlanSelectOption[] {
    return this.facade.proveedoresActivos().map((provider) => ({
      label: provider.nombre ?? '',
      value: provider.id
    }));
  }

  protected zoneOptions(): PlanSelectOption[] {
    return this.facade.planZonasActivas().map((zone) => ({
      label: zone.nombre ?? '',
      value: zone.id
    }));
  }

  protected planTypeOptions(): PlanSelectOption[] {
    return this.facade.planTypeOptions.map((planType) => ({
      label: planType.label,
      value: planType.value
    }));
  }

  protected additionalOptions(): PlanSelectOption[] {
    return this.facade.availablePlanAdditionalOptions().map((additional) => ({
      label: additional.nombre ?? '',
      value: additional.id
    }));
  }

  protected readonly unitOptions: PlanSelectOption[] = [
    { label: 'MBPS', value: 'MBPS' },
    { label: 'GBPS', value: 'GBPS' }
  ];

  protected readonly technologyOptions: PlanSelectOption[] = [
    { label: 'FTTH', value: 'FTTH' },
    { label: 'HFC', value: 'HFC' },
    { label: 'HÍBRIDA', value: 'HIBRIDA' }
  ];

  protected controlValue(controlName: string): string | number | null {
    return this.form.get(controlName)?.value ?? '';
  }

  protected setControlValue(controlName: string, value: string | number): void {
    this.markChanged();
    this.form.get(controlName)?.setValue(value);
  }

  protected providerAccentClass(): string {
    const provider = this.facade.selectedPlanProviderName().toUpperCase();
    if (provider.includes('CLARO')) return 'plan-drawer__surface--claro';
    if (provider.includes('WIN')) return 'plan-drawer__surface--win';
    return 'plan-drawer__surface--neutral';
  }

  protected isServiceSelected(service: PlanService): boolean {
    return this.facade.isPlanServiceSelected(service);
  }

  protected isServiceDisabled(service: PlanService): boolean {
    return this.facade.isPlanServiceDisabled(service);
  }

  protected requestClose(): void {
    if (this.showDiscardConfirmation) return;

    if (this.hasUnsavedChanges()) {
      this.showDiscardConfirmation = true;
      return;
    }

    this.closeImmediately();
  }

  protected cancelDiscard(): void {
    this.showDiscardConfirmation = false;
  }

  protected confirmDiscard(): void {
    this.closeImmediately();
  }

  protected hasUnsavedChanges(): boolean {
    return this.userChangedForm || this.form.dirty;
  }

  protected markChanged(): void {
    this.userChangedForm = true;
  }

  private closeImmediately(): void {
    this.showDiscardConfirmation = false;
    this.userChangedForm = false;

    if (this.mode === 'create') {
      this.facade.closeCreatePlanDialog();
    } else {
      this.facade.closeEditPlanDialog();
    }
  }

  protected submit(): void {
    if (this.mode === 'create') {
      void this.facade.submitPlan();
    } else {
      void this.facade.updatePlan();
    }
  }

  protected providerChanged(value: string | number): void {
    if (this.mode !== 'create') return;

    this.markChanged();
    this.form.get('idProveedor')?.setValue(value ? Number(value) : null);
    this.facade.onCreatePlanProviderChanged();
  }

  protected zoneChanged(value: string | number): void {
    this.markChanged();
    this.form.get('idZona')?.setValue(value ? Number(value) : 0);
  }

  protected changePlanType(value: string | number): void {
    const planType = String(value) as PlanType | '';
    if (planType) {
      this.markChanged();
      this.facade.changePlanType(this.mode, planType);
    }
  }

  protected addPlanAdditional(value: string | number): void {
    const id = Number(value);
    if (id) {
      this.markChanged();
      this.facade.addPlanAdditional(id);
    }
  }

  protected removePlanAdditional(id: number): void {
    this.markChanged();
    this.facade.removePlanAdditional(id);
  }

  protected updatePlanAdditionalQuantity(id: number, field: 'cantidadIncluida' | 'cantidadMaximaAdicional', value: string): void {
    this.markChanged();
    this.facade.updatePlanAdditionalQuantity(id, field, value);
  }

  protected updatePlanAdditionalPurchase(id: number, value: boolean): void {
    this.markChanged();
    this.facade.updatePlanAdditionalPurchase(id, value);
  }

  protected toggleService(service: PlanService, event: Event): void {
    this.markChanged();
    this.facade.togglePlanService(this.mode, service, (event.target as HTMLInputElement).checked);
  }

  protected setPriceMode(promotional: boolean): void {
    this.markChanged();
    this.facade.togglePlanPricePromotional(this.mode, promotional);
  }

  protected setSpeedMode(promotional: boolean): void {
    this.markChanged();
    this.facade.togglePlanSpeedPromotional(this.mode, promotional);
  }

  protected preventNonInteger(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }
}
