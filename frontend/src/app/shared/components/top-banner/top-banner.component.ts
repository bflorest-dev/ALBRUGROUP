import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-top-banner',
  templateUrl: './top-banner.component.html',
  styleUrl: './top-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBannerComponent {}
