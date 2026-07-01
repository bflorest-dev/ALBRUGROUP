import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type AuthBackgroundTheme = 'day' | 'night';

@Injectable({
  providedIn: 'root'
})
export class AuthBackgroundThemeService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeState = signal<AuthBackgroundTheme>(this.getThemeForDate(new Date()));
  readonly theme = this.themeState.asReadonly();

  constructor() {
    const intervalId = window.setInterval(() => {
      this.themeState.set(this.getThemeForDate(new Date()));
    }, 60_000);

    this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
  }

  getCurrentTheme(date = new Date()): AuthBackgroundTheme {
    return this.getThemeForDate(date);
  }

  private getThemeForDate(date: Date): AuthBackgroundTheme {
    const hour = date.getHours();
    return hour >= 4 && hour < 19 ? 'day' : 'night';
  }
}
