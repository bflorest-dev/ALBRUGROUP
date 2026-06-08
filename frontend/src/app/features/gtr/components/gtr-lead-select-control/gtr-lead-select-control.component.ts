import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-gtr-lead-select-control',
  templateUrl: './gtr-lead-select-control.component.html',
  styleUrl: './gtr-lead-select-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrLeadSelectControlComponent {
  readonly selected = input(false);
  readonly partial = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input('Seleccionar lead');
  readonly title = input<string | null>(null);

  readonly selectionChange = output<boolean>();

  toggleSelection(): void {
    if (this.disabled()) {
      return;
    }

    this.selectionChange.emit(!this.selected());
  }
}
