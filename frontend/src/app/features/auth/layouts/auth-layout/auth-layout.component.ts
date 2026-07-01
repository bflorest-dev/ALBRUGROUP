import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthBackgroundComponent } from '../../components/auth-background/auth-background.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, AuthBackgroundComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthLayoutComponent {}
