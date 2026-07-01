import { Injectable } from '@angular/core';

export type AuthBackgroundTheme = 'default';

@Injectable({
  providedIn: 'root'
})
export class AuthBackgroundThemeService {
  getCurrentTheme(_date = new Date()): AuthBackgroundTheme {
    return 'default';
  }
}
