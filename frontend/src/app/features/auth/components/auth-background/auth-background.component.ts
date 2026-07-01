import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthBackgroundThemeService } from '../../services/auth-background-theme.service';

@Component({
  selector: 'app-auth-background',
  templateUrl: './auth-background.component.html',
  styleUrl: './auth-background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthBackgroundComponent {
  private readonly themeService = inject(AuthBackgroundThemeService);

  protected readonly backgroundClass = computed(
    () => `auth-background--${this.themeService.getCurrentTheme()}`
  );
}
