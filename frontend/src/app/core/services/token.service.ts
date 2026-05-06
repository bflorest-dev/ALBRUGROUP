import { Injectable, effect, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenState = signal<string | null>(localStorage.getItem(STORAGE_KEYS.accessToken));

  constructor() {
    effect(() => {
      const token = this.tokenState();

      if (token) {
        localStorage.setItem(STORAGE_KEYS.accessToken, token);
        return;
      }

      localStorage.removeItem(STORAGE_KEYS.accessToken);
    });
  }

  getToken(): string | null {
    return this.tokenState();
  }

  setToken(token: string): void {
    this.tokenState.set(token);
  }

  clearToken(): void {
    this.tokenState.set(null);
  }
}
