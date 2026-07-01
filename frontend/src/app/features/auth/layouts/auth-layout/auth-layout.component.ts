import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthBackgroundComponent } from '../../components/auth-background/auth-background.component';
import { AuthBackgroundThemeService } from '../../services/auth-background-theme.service';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, AuthBackgroundComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthLayoutComponent {
  private readonly themeService = inject(AuthBackgroundThemeService);

  protected readonly pageThemeClass = computed(
    () => `auth-page--${this.themeService.theme()}`
  );
}
