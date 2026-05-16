import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommunityWorkspaceFacade } from '../../facades/community-workspace.facade';

@Component({
  selector: 'app-community-workspace-page',
  imports: [ReactiveFormsModule, JsonPipe],
  providers: [CommunityWorkspaceFacade],
  templateUrl: './community-workspace-page.component.html',
  styleUrl: './community-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityWorkspacePageComponent implements OnInit {
  protected readonly facade = inject(CommunityWorkspaceFacade);
  protected readonly sections = [
    { id: 'proveedores', label: 'Proveedores' },
    { id: 'cuentas', label: 'Cuentas' },
    { id: 'campanas', label: 'Campanas' },
    { id: 'planes', label: 'Planes' },
    { id: 'promociones', label: 'Promociones' },
    { id: 'zonas', label: 'Zonas' }
  ] as const;

  ngOnInit(): void {
    void this.facade.initialize();
  }

  protected display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }
}
