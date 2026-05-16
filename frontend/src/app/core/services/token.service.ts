import { Injectable, effect, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly accessTokenState = signal<string | null>(
    localStorage.getItem(STORAGE_KEYS.accessToken)
  );
  private readonly refreshTokenState = signal<string | null>(
    localStorage.getItem(STORAGE_KEYS.refreshToken)
  );

  constructor() {
    effect(() => {
      const token = this.accessTokenState();

      if (token) {
        localStorage.setItem(STORAGE_KEYS.accessToken, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
      }
    });

    effect(() => {
      const token = this.refreshTokenState();

      if (token) {
        localStorage.setItem(STORAGE_KEYS.refreshToken, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.refreshToken);
      }
    });
  }

  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenState();
  }

  setAccessToken(token: string): void {
    this.accessTokenState.set(token);
  }

  setRefreshToken(token: string): void {
    this.refreshTokenState.set(token);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessTokenState.set(accessToken);
    this.refreshTokenState.set(refreshToken);
  }

  clearTokens(): void {
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
  }
}
