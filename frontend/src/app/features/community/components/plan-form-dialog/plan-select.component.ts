import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';

export interface PlanSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'app-plan-select',
  templateUrl: './plan-select.component.html',
  styleUrl: './plan-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanSelectComponent {
  @ViewChild('menu') private menu?: ElementRef<HTMLDetailsElement>;

  @Input() label = '';
  @Input() value: string | number | null | undefined = '';
  @Input() placeholder = 'Seleccionar';
  @Input() options: PlanSelectOption[] = [];
  @Input() disabled = false;

  @Output() selectionChange = new EventEmitter<string | number>();

  protected get selectedLabel(): string {
    if (this.value === null || this.value === undefined || this.value === '') {
      return this.placeholder;
    }

    return this.options.find((option) => String(option.value) === String(this.value))?.label ?? this.placeholder;
  }

  protected isSelected(option: PlanSelectOption): boolean {
    return String(option.value) === String(this.value);
  }

  protected preventToggle(event: MouseEvent): void {
    if (!this.disabled) return;

    event.preventDefault();
    event.stopPropagation();
  }

  protected choose(option: PlanSelectOption, menu: HTMLDetailsElement): void {
    if (this.disabled || option.disabled) return;

    this.selectionChange.emit(option.value);
    menu.open = false;
  }

  @HostListener('document:click', ['$event'])
  protected closeOnOutsideClick(event: MouseEvent): void {
    const menu = this.menu?.nativeElement;
    if (!menu?.open) return;

    const target = event.target as Node | null;
    if (target && menu.contains(target)) return;

    menu.open = false;
  }
}
