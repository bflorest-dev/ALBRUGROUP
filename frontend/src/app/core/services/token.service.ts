import { Injectable, effect, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

type JwtPayload = Record<string, unknown>;

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

  getEquipoIds(token = this.getAccessToken()): number[] {
    const payload = this.decodePayload(token);
    const raw = payload?.['equipos'];
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
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

  private decodePayload(token: string | null): JwtPayload | null {
    if (!token) {
      return null;
    }
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }
    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(padded)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
