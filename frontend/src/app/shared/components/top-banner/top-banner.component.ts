import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-top-banner',
  templateUrl: './top-banner.component.html',
  styleUrl: './top-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBannerComponent {
  readonly title = input('');
  readonly detail = input('');
  readonly context = input('');
  readonly icon = input('ti ti-layout-dashboard');
  protected readonly hasContent = computed(() => Boolean(this.title() || this.detail() || this.context()));
}
