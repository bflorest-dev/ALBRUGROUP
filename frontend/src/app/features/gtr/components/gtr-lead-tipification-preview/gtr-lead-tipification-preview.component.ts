import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { SkeletonModule } from 'primeng/skeleton';
import {
  EMPTY_GTR_TIPIFICATION_ADVISOR_PREVIEW,
  GtrTipificationAdvisorPreviewState
} from '../../models/gtr-tipification-preview';

@Component({
  selector: 'app-gtr-lead-tipification-preview',
  standalone: true,
  imports: [ButtonModule, PopoverModule, SkeletonModule],
  templateUrl: './gtr-lead-tipification-preview.component.html',
  styleUrl: './gtr-lead-tipification-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrLeadTipificationPreviewComponent implements OnDestroy {
  private static readonly HOVER_OPEN_MS = 180;
  private static readonly HOVER_CLOSE_MS = 220;

  readonly leadId = input.required<number>();
  readonly count = input(0);
  readonly state = input<GtrTipificationAdvisorPreviewState>(EMPTY_GTR_TIPIFICATION_ADVISOR_PREVIEW);
  readonly previewRequested = output<void>();

  protected readonly popoverOpen = signal(false);
  protected readonly popoverId = computed(() => `gtr-tipification-preview-${this.leadId()}`);

  private hoverOpenTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

  protected onTriggerEnter(event: MouseEvent, popover: Popover): void {
    this.cancelClose();
    this.cancelOpen();
    if (this.popoverOpen()) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    this.hoverOpenTimer = setTimeout(() => {
      this.hoverOpenTimer = null;
      this.previewRequested.emit();
      popover.show(event, target);
    }, GtrLeadTipificationPreviewComponent.HOVER_OPEN_MS);
  }

  protected onTriggerLeave(popover: Popover): void {
    this.cancelOpen();
    this.scheduleClose(popover);
  }

  protected onTriggerFocus(event: FocusEvent, popover: Popover): void {
    this.cancelOpen();
    this.cancelClose();
    this.previewRequested.emit();
    if (!this.popoverOpen()) {
      popover.show(event, event.currentTarget as HTMLElement);
    }
  }

  protected onTriggerBlur(popover: Popover): void {
    this.scheduleClose(popover);
  }

  protected onPanelEnter(): void {
    this.cancelClose();
  }

  protected onPanelLeave(popover: Popover): void {
    this.scheduleClose(popover);
  }

  protected onPopoverShow(): void {
    this.popoverOpen.set(true);
  }

  protected onPopoverHide(): void {
    this.popoverOpen.set(false);
  }

  protected onTriggerClick(event: MouseEvent, popover: Popover): void {
    this.cancelOpen();
    this.cancelClose();
    this.previewRequested.emit();
    if (this.popoverOpen()) {
      return;
    }
    popover.show(event, event.currentTarget as HTMLElement);
  }

  protected onEscape(popover: Popover): void {
    this.cancelOpen();
    this.cancelClose();
    popover.hide();
  }

  ngOnDestroy(): void {
    this.cancelOpen();
    this.cancelClose();
  }

  private scheduleClose(popover: Popover): void {
    this.cancelClose();
    this.hoverCloseTimer = setTimeout(() => {
      this.hoverCloseTimer = null;
      popover.hide();
    }, GtrLeadTipificationPreviewComponent.HOVER_CLOSE_MS);
  }

  private cancelOpen(): void {
    if (this.hoverOpenTimer !== null) {
      clearTimeout(this.hoverOpenTimer);
      this.hoverOpenTimer = null;
    }
  }

  private cancelClose(): void {
    if (this.hoverCloseTimer !== null) {
      clearTimeout(this.hoverCloseTimer);
      this.hoverCloseTimer = null;
    }
  }
}
