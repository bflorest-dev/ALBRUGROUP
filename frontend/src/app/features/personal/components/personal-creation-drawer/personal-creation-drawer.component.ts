import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { AdminPersonalFacade } from '../../../admin/facades/admin-personal.facade';
import { PersonalEmployeeIdentityFormComponent } from '../personal-employee-identity-form/personal-employee-identity-form.component';

@Component({
  selector: 'app-personal-creation-drawer',
  imports: [PersonalEmployeeIdentityFormComponent],
  providers: [AdminPersonalFacade],
  templateUrl: './personal-creation-drawer.component.html',
  styleUrl: './personal-creation-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalCreationDrawerComponent {
  protected readonly facade = inject(AdminPersonalFacade);
  readonly visible = input(false);
  readonly theme = input<'light' | 'dark'>('light');
  readonly closed = output<boolean>();

  constructor() {
    effect(() => {
      if (this.visible()) this.facade.resetFlow();
    });
  }

  protected close(): void {
    this.closed.emit(Boolean(this.facade.identityCreationResult()));
  }
}
