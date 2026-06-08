import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-gtr-event-comment-popover',
  imports: [ButtonModule, PopoverModule],
  templateUrl: './gtr-event-comment-popover.component.html',
  styleUrl: './gtr-event-comment-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrEventCommentPopoverComponent {
  readonly comment = input<string | null | undefined>(null);

  protected readonly normalizedComment = computed(() => this.comment()?.trim() ?? '');
  protected readonly hasComment = computed(() => this.normalizedComment().length > 0);
}
